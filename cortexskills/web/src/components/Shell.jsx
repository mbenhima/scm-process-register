import { useEffect, useRef, useState } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { useI18n } from '../lib/i18n.jsx';
import { useSession, useData } from '../lib/session.jsx';
import { get, post } from '../lib/api.js';
import { Icon, Btn } from './ui.jsx';
import { HeaderSearch, SearchDialog, openSearch } from './GlobalSearch.jsx';

export default function Shell({ children }) {
  const { me, nav, savePrefs } = useSession(); const { t } = useI18n(); const loc = useLocation();
  const prefs = me?.prefs || {}; const dock = prefs.dock || 'left'; const pinned = prefs.pinned !== false;
  const [open, setOpen] = useState(false); const [mobile, setMobile] = useState(() => window.innerWidth <= 860);
  const [dropdown, setDropdown] = useState(null);
  useEffect(() => { const r = () => setMobile(window.innerWidth <= 860); window.addEventListener('resize', r); return () => window.removeEventListener('resize', r); }, []);
  useEffect(() => { setOpen(false); setDropdown(null); }, [loc.pathname]);
  useEffect(() => { const k = e => { if (e.key === 'Escape') { setOpen(false); setDropdown(null); } }; document.addEventListener('keydown', k); return () => document.removeEventListener('keydown', k); }, []);
  if (!nav) return null;
  const horizontal = !mobile && (dock === 'top' || dock === 'bottom');
  const favs = (prefs.favorites || []).map(r => nav.items.find(i => i.route === r)).filter(Boolean);
  const collapsed = new Set(prefs.collapsed || []);
  const toggleFav = route => savePrefs({ favorites: prefs.favorites?.includes(route) ? prefs.favorites.filter(x => x !== route) : [...(prefs.favorites || []), route] });
  const toggleGroup = g => savePrefs({ collapsed: collapsed.has(g) ? [...collapsed].filter(x => x !== g) : [...collapsed, g] });
  const groups = [{ id: 'favorites', items: favs }, ...nav.groups.map(g => ({ id: g, items: nav.items.filter(i => i.group === g) }))].filter(g => g.items.length);
  const item = i => (<NavLink key={i.id + (i.group)} to={i.route} end={i.route === '/'} className="nav-item" onClick={() => setOpen(false)}>
    <Icon name={i.icon} /><span>{t(i.label)}</span>
    {!horizontal && <button type="button" className="fav" aria-pressed={!!prefs.favorites?.includes(i.route)} aria-label={t('nav.favorite')} onClick={e => { e.preventDefault(); e.stopPropagation(); toggleFav(i.route); }}><Icon name="Star" size={14} /></button>}
  </NavLink>);
  const navOpen = mobile || !pinned ? open : true;
  return (<div className="shell" data-dock={mobile ? 'left' : dock} data-pinned={mobile ? 'true' : String(pinned || horizontal)}>
    <a href="#main" className="skip-link">{t('nav.skip')}</a>
    {(mobile && open) && <div className="scrim" onClick={() => setOpen(false)} />}
    <nav className="nav" aria-label={t('nav.primary')} data-open={String(navOpen)} onMouseEnter={() => !pinned && !mobile && !horizontal && setOpen(true)} onMouseLeave={() => !pinned && !mobile && !horizontal && setOpen(false)}>
      <div className="nav-head"><Link to="/" className="brand"><img src="/cortexskills-mark.png" alt="" />CortexSkills</Link>
        {!horizontal && !mobile && <Btn icon={pinned ? 'PinOff' : 'Pin'} kind="ghost" size="sm" aria-label={pinned ? t('nav.unpin') : t('nav.pin')} onClick={() => savePrefs({ pinned: !pinned })} />}
        {mobile && <Btn icon="X" kind="ghost" aria-label={t('common.close')} onClick={() => setOpen(false)} />}</div>
      <button type="button" className="nav-item nav-search" onClick={() => openSearch()}><Icon name="Search" /><span>{t('nav.search')}</span><kbd className="xs">Ctrl K</kbd></button>
      <div className="nav-scroll">{groups.map(g => {
        const isCollapsed = horizontal ? dropdown !== g.id : collapsed.has(g.id);
        return (<div className="nav-group" key={g.id} onMouseLeave={() => horizontal && setDropdown(null)}>
          <button type="button" className="nav-group-btn" aria-expanded={!isCollapsed} onClick={() => horizontal ? setDropdown(d => (d === g.id ? null : g.id)) : toggleGroup(g.id)} onMouseEnter={() => horizontal && setDropdown(g.id)}>
            {t('navGroup.' + g.id)}<Icon name={isCollapsed ? (horizontal ? 'ChevronDown' : 'ChevronRight') : 'ChevronDown'} size={14} /></button>
          {!isCollapsed && <div className="nav-group-items">{g.items.map(item)}</div>}</div>);
      })}</div>
      <button type="button" className="nav-handle" aria-label={t('nav.open')} aria-expanded={open} onFocus={() => setOpen(true)} onClick={() => setOpen(o => !o)} />
    </nav>
    <div className="shell-main"><Header onMenu={() => setOpen(o => !o)} showMenu={mobile || (!pinned && !horizontal)} /><main id="main" className="content" tabIndex={-1}>{children}</main></div>
    <AssistantWidget /><SearchDialog />
  </div>);
}

function Header({ onMenu, showMenu }) {
  const { me, projects, project, setProject, switchOrg, changeLang, logout } = useSession(); const { t, L, lang, languages } = useI18n();
  const orgs = useData('/context/orgs'); const [menu, setMenu] = useState(false); const navigate = useNavigate();
  const unread = useData('/alerts/unread-count');
  useEffect(() => { const id = setInterval(() => unread.reload(), 60000); return () => clearInterval(id); }, []); // eslint-disable-line
  return (<header className="header">
    {showMenu && <Btn icon="Menu" kind="ghost" aria-label={t('nav.open')} onClick={onMenu} />}
    <select className="input header-select" aria-label={t('header.organization')} value={me.org?.id || ''} onChange={e => switchOrg(e.target.value)}>
      {(orgs.data || []).map(o => <option key={o.id} value={o.id}>{L(o.name)}{o.readOnly ? ` (${t('header.readOnly')})` : ''}</option>)}</select>
    <select className="input header-select hide-mobile" aria-label={t('header.project')} value={project || ''} onChange={e => setProject(e.target.value)}>
      <option value="">{t('header.allProjects')}</option>{projects.map(p => <option key={p.id} value={p.id}>{L(p.name)}</option>)}</select>
    {me.foreignReadOnly && <span className="pill s3 hide-mobile">{t('header.readOnlyGroup')}</span>}
    <span className="spacer" />
    <HeaderSearch />
    <div className="seg hide-mobile" role="group" aria-label={t('header.language')}>{languages.map(l => <button key={l.code} aria-pressed={lang === l.code} onClick={() => changeLang(l.code)} lang={l.code}>{l.code.toUpperCase()}</button>)}</div>
    <select className="input show-mobile" style={{ width: 72 }} aria-label={t('header.language')} value={lang} onChange={e => changeLang(e.target.value)}>{languages.map(l => <option key={l.code} value={l.code}>{l.code.toUpperCase()}</option>)}</select>
    <div className="rel"><Btn icon="Bell" kind="ghost" aria-label={t('nav.alerts') + ` (${unread.data?.n || 0})`} onClick={() => navigate('/alerts')} />{unread.data?.n > 0 && <span className="bell-count" aria-hidden="true">{unread.data.n > 99 ? '99+' : unread.data.n}</span>}</div>
    <Btn icon="MessageSquare" kind="ghost" aria-label={t('nav.assistant')} onClick={() => document.dispatchEvent(new CustomEvent('assistant:open'))} />
    <div className="rel"><Btn icon="CircleUserRound" kind="ghost" aria-haspopup="menu" aria-expanded={menu} aria-label={me.user.name} onClick={() => setMenu(m => !m)} />
      {menu && <div className="menu" role="menu" onMouseLeave={() => setMenu(false)}>
        <div style={{ padding: 'var(--sp-2) var(--sp-3)' }}><div className="strong">{me.user.name}</div><div className="xs muted">{me.user.email}</div><div className="xs muted">{me.user.title}</div></div>
        <hr className="divider" style={{ margin: 'var(--sp-2) 0' }} />
        <Link role="menuitem" to="/settings" onClick={() => setMenu(false)}><Icon name="Settings" />{t('nav.settings')}</Link>
        <Link role="menuitem" to="/help" onClick={() => setMenu(false)}><Icon name="LifeBuoy" />{t('nav.help')}</Link>
        <button role="menuitem" onClick={logout}><Icon name="LogOut" />{t('header.logout')}</button></div>}</div>
  </header>);
}

function AssistantWidget() {
  const { can, project } = useSession(); const { t, L } = useI18n();
  const [open, setOpen] = useState(false); const [msgs, setMsgs] = useState([]); const [q, setQ] = useState(''); const end = useRef(null);
  useEffect(() => { const h = () => setOpen(true); document.addEventListener('assistant:open', h); return () => document.removeEventListener('assistant:open', h); }, []);
  useEffect(() => end.current?.scrollIntoView({ block: 'end' }), [msgs]);
  if (!can('assistant.view')) return null;
  const ask = async e => { e.preventDefault(); if (!q.trim()) return; const question = q; setQ(''); setMsgs(m => [...m, { me: true, text: question }]);
    try { const r = await post('/assistant/ask', { question }); setMsgs(m => [...m, { text: r.answer, refs: r.references, refused: r.refused }]); } catch (err) { setMsgs(m => [...m, { text: err.message }]); } };
  return (<>
    {open && <section className="card assist-panel" aria-label={t('nav.assistant')}>
      <div className="card-head" style={{ padding: 'var(--sp-4)', margin: 0, borderBottom: '1px solid var(--pa-grey-line)' }}><h3>{t('nav.assistant')}</h3><Btn icon="X" kind="ghost" size="sm" aria-label={t('common.close')} onClick={() => setOpen(false)} /></div>
      <div className="chat" aria-live="polite">{!msgs.length && <p className="muted">{t('assistant.intro')}</p>}
        {msgs.map((m, i) => <div key={i} className={`msg ${m.me ? 'me' : 'bot'}`}>{m.text}{m.refs?.length > 0 && <div className="xs muted" style={{ marginTop: 8 }}>{t('assistant.sources')}: {m.refs.slice(0, 3).map(r => r.title).join(' · ')}</div>}</div>)}<div ref={end} /></div>
      <form onSubmit={ask} className="row" style={{ padding: 'var(--sp-3)', borderTop: '1px solid var(--pa-grey-line)', flexWrap: 'nowrap' }}>
        <input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder={t('assistant.placeholder')} aria-label={t('assistant.placeholder')} /><Btn kind="primary" icon="Send" type="submit" aria-label={t('assistant.send')} /></form></section>}
    <button className="assist-fab" aria-label={t('nav.assistant')} aria-expanded={open} onClick={() => setOpen(o => !o)}><Icon name={open ? 'X' : 'MessageSquare'} size={24} /></button>
  </>);
}
