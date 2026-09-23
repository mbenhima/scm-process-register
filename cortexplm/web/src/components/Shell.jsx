import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Pin, PinOff, Star, ChevronDown, ChevronRight, Menu, Bell, LogOut, SlidersHorizontal, PanelLeft, PanelRight, PanelTop, PanelBottom,
  Lock, Languages, X, TriangleAlert,
} from 'lucide-react';
import { NAV, ALL_ITEMS } from './navModel.js';
import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { api } from '../lib/api.js';
import { IconButton } from './ui.jsx';
import Assistant from './Assistant.jsx';

export function BrandMark({ size = 32 }) {
  return (
    <svg className="brand-mark" width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <circle cx="16" cy="16" r="15" fill="var(--pa-orange)" />
      <path d="M10.5 16a5.5 5.5 0 0 1 9.8-3.4M21.5 16a5.5 5.5 0 0 1-9.8 3.4" stroke="var(--pa-white)" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <circle cx="21" cy="11.8" r="1.6" fill="var(--pa-white)" /><circle cx="11" cy="20.2" r="1.6" fill="var(--pa-white)" />
    </svg>
  );
}

function useVisibleItems() {
  const { can, feature } = useAuth();
  return useMemo(() => NAV.map((g) => ({
    ...g, items: g.items.filter((i) => !i.perm || can(...i.perm)).map((i) => ({ ...i, locked: i.feature && !feature(i.feature) })),
  })).filter((g) => g.items.length), [can, feature]);
}

function NavItem({ item, fav, onFav, onNavigate }) {
  const { t } = useI18n();
  const Icon = item.locked ? Lock : item.icon;
  return (
    <NavLink to={item.to} end={item.to === '/'} onClick={onNavigate} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} ${item.locked ? 'locked' : ''}`}
      title={item.locked ? t('Not included in your subscription') : undefined}>
      <Icon aria-hidden /><span>{t(item.label)}</span>
      <button type="button" className="fav" aria-pressed={fav} aria-label={fav ? t('Unpin {x} from favourites', { x: t(item.label) }) : t('Pin {x} to favourites', { x: t(item.label) })}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onFav(item.to); }}><Star size={14} aria-hidden /></button>
    </NavLink>
  );
}

function PositionPicker({ pos, pinned, onPos, onPin, onClose }) {
  const { t } = useI18n();
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', h); document.addEventListener('keydown', k);
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('keydown', k); };
  }, [onClose]);
  const opts = [['left', t('Left'), PanelLeft], ['right', t('Right'), PanelRight], ['top', t('Top'), PanelTop], ['bottom', t('Bottom'), PanelBottom]];
  const vertical = pos === 'left' || pos === 'right';
  return (
    <div className="popover" ref={ref} role="dialog" aria-label={t('Menu position')} style={vertical ? { top: 56, insetInlineStart: 8 } : { [pos === 'bottom' ? 'bottom' : 'top']: 52, insetInlineEnd: 8 }}>
      <div className="strong small" style={{ marginBottom: 8 }}>{t('Menu position')}</div>
      <div className="pos-grid">
        {opts.map(([v, label, Icon]) => <button key={v} type="button" aria-pressed={pos === v} onClick={() => onPos(v)}><Icon aria-hidden />{label}</button>)}
      </div>
      <hr className="rule" style={{ margin: '16px 0' }} />
      <label className="check"><input type="checkbox" checked={pinned} onChange={(e) => onPin(e.target.checked)} />{t('Keep the menu pinned open')}</label>
      <p className="muted" style={{ marginTop: 8, marginBottom: 0 }}>{t('When unpinned, the menu slides away and slides back when you point at the screen edge.')}</p>
    </div>
  );
}

export default function Shell() {
  const { me, logout, switchOrg, savePrefs, saveLanguage, can } = useAuth();
  const { t, languages, lang, dir } = useI18n();
  const nav = useNavigate();
  const loc = useLocation();
  const groups = useVisibleItems();
  const prefs = me.user.prefs || {};
  const pos = prefs.navPos || (dir === 'rtl' ? 'right' : 'left');
  const pinned = prefs.navPinned !== false;
  const favs = prefs.favorites || [];
  const collapsed = prefs.collapsed || {};
  const [open, setOpen] = useState(false);
  const [picker, setPicker] = useState(false);
  const [menu, setMenu] = useState(null);
  const [unread, setUnread] = useState(0);
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 760px)').matches);
  const closeTimer = useRef(null);
  const vertical = pos === 'left' || pos === 'right';

  useEffect(() => { const mq = window.matchMedia('(max-width: 760px)'); const h = () => setMobile(mq.matches); mq.addEventListener('change', h); return () => mq.removeEventListener('change', h); }, []);
  useEffect(() => { setOpen(false); setMenu(null); }, [loc.pathname]);
  useEffect(() => {
    if (!can('alert.view')) return undefined;
    const load = () => api('/alerts/unread-count').then((r) => setUnread(r.n)).catch(() => {});
    load(); const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, [can, me.organization?.id]);
  useEffect(() => { const k = (e) => { if (e.key === 'Escape') { setOpen(false); setMenu(null); } }; document.addEventListener('keydown', k); return () => document.removeEventListener('keydown', k); }, []);

  const toggleFav = (to) => savePrefs({ favorites: favs.includes(to) ? favs.filter((f) => f !== to) : [...favs, to] });
  const favItems = favs.map((f) => ALL_ITEMS.find((i) => i.to === f)).filter(Boolean).filter((i) => groups.some((g) => g.items.some((x) => x.to === i.to)));
  const hoverOpen = () => { if (!pinned) { clearTimeout(closeTimer.current); setOpen(true); } };
  const hoverClose = () => { if (!pinned && !picker) { clearTimeout(closeTimer.current); closeTimer.current = setTimeout(() => setOpen(false), 350); } };
  const lic = me.licence;

  const controls = (
    <div className="row" style={{ gap: 4, position: 'relative' }}>
      <IconButton icon={pinned ? PinOff : Pin} size="sm" label={pinned ? t('Unpin menu (slide away)') : t('Pin menu open')} pressed={pinned} onClick={() => savePrefs({ navPinned: !pinned })} />
      <IconButton icon={SlidersHorizontal} size="sm" label={t('Menu position')} pressed={picker} onClick={() => setPicker((p) => !p)} />
      {mobile && <IconButton icon={X} size="sm" label={t('Close menu')} onClick={() => setOpen(false)} />}
      {picker && <PositionPicker pos={pos} pinned={pinned} onPos={(v) => savePrefs({ navPos: v })} onPin={(v) => savePrefs({ navPinned: v })} onClose={() => setPicker(false)} />}
    </div>
  );

  const verticalNav = (
    <nav className="nav nav-v" aria-label={t('Main menu')} onMouseEnter={hoverOpen} onMouseLeave={hoverClose} onFocus={hoverOpen}>
      <div className="nav-head"><Link to="/" className="brand"><BrandMark /><span>CortexPLM</span></Link>{controls}</div>
      <div className="nav-scroll">
        {favItems.length > 0 && (
          <div className="nav-group">
            <div className="nav-group-title" style={{ cursor: 'default' }}>{t('Pinned')}</div>
            {favItems.map((i) => <NavItem key={`f${i.to}`} item={{ ...i, locked: groups.flatMap((g) => g.items).find((x) => x.to === i.to)?.locked }} fav onFav={toggleFav} />)}
          </div>
        )}
        {groups.map((g) => (
          <div className="nav-group" key={g.group}>
            <button type="button" className="nav-group-title" aria-expanded={!collapsed[g.group]} onClick={() => savePrefs({ collapsed: { ...collapsed, [g.group]: !collapsed[g.group] } })}>
              <span>{t(g.group)}</span>{collapsed[g.group] ? <ChevronRight size={14} aria-hidden /> : <ChevronDown size={14} aria-hidden />}
            </button>
            {!collapsed[g.group] && g.items.map((i) => <NavItem key={i.to} item={i} fav={favs.includes(i.to)} onFav={toggleFav} />)}
          </div>
        ))}
      </div>
    </nav>
  );

  const openMenu = (group, e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const style = pos === 'bottom' ? { bottom: window.innerHeight - r.top + 4 } : { top: r.bottom + 4 };
    style[document.dir === 'rtl' ? 'right' : 'left'] = Math.max(8, Math.min(document.dir === 'rtl' ? window.innerWidth - r.right : r.left, window.innerWidth - 280));
    setMenu(menu?.group === group ? null : { group, style });
  };
  const horizontalNav = mobile ? verticalNav : (
    <nav className="nav nav-h" aria-label={t('Main menu')} onMouseEnter={hoverOpen} onMouseLeave={hoverClose}>
      <div className="menubar" role="menubar">
        {favItems.map((i) => <NavLink key={`f${i.to}`} to={i.to} end={i.to === '/'} className={({ isActive }) => `mb-trigger ${isActive ? 'active' : ''}`}><Star size={14} aria-hidden />{t(i.label)}</NavLink>)}
        {groups.map((g) => {
          const active = g.items.some((i) => (i.to === '/' ? loc.pathname === '/' : loc.pathname.startsWith(i.to)));
          return (
            <div key={g.group}>
              <button type="button" className={`mb-trigger ${active ? 'active' : ''}`} aria-haspopup="true" aria-expanded={menu?.group === g.group} onClick={(e) => openMenu(g.group, e)}>
                {t(g.group)}<ChevronDown size={14} aria-hidden />
              </button>
            </div>
          );
        })}
      </div>
      {controls}
      {menu && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 65 }} onClick={() => setMenu(null)} />
          <div className="mb-menu" style={menu.style} role="menu">
            {groups.find((g) => g.group === menu.group).items.map((i) => <NavItem key={i.to} item={i} fav={favs.includes(i.to)} onFav={toggleFav} onNavigate={() => setMenu(null)} />)}
          </div>
        </>
      )}
    </nav>
  );

  return (
    <div className={`shell pos-${mobile ? 'left' : pos} ${pinned && !mobile ? 'pinned' : ''} ${open ? 'nav-open' : ''}`}>
      <a href="#content" className="sr-only">{t('Skip to content')}</a>
      {(vertical || mobile) && verticalNav}
      {!pinned && !mobile && <button type="button" className="edge-handle" aria-label={t('Open menu')} onMouseEnter={hoverOpen} onClick={() => setOpen(true)}><span /></button>}
      {mobile && open && <div className="scrim" onClick={() => setOpen(false)} />}
      <div className="main">
        <header className="topbar">
          {(mobile || !pinned) && <IconButton icon={Menu} label={t('Open menu')} onClick={() => setOpen((o) => !o)} />}
          {(!vertical || !pinned || mobile) && <Link to="/" className="brand"><BrandMark /><span>CortexPLM</span></Link>}
          <div className="grow" />
          {me.user.isPlatformAdmin && (
            <select className="select org-switch" aria-label={t('Organization')} value={me.organization.id} onChange={(e) => switchOrg(e.target.value).then(() => nav('/'))}>
              {me.organizations.map((o) => <option key={o.id} value={o.id}>{o.name} · {t(o.industry)}</option>)}
            </select>
          )}
          {!me.user.isPlatformAdmin && <span className="muted desktop-only">{me.organization.name}</span>}
          <div className="row desktop-only" style={{ gap: 4 }}>
            <Languages size={18} aria-hidden style={{ color: 'var(--pa-grey-medium)' }} />
            <select className="select" style={{ width: 'auto' }} aria-label={t('Language')} value={lang} onChange={(e) => saveLanguage(e.target.value)}>
              {languages.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
            </select>
          </div>
          {can('alert.view') && (
            <IconButton icon={Bell} label={t('{n} unread alerts', { n: unread })} onClick={() => nav('/alerts')}>
              {unread > 0 && <span className="dot-count" aria-hidden>{unread > 99 ? '99+' : unread}</span>}
            </IconButton>
          )}
          <div className="desktop-only" style={{ textAlign: 'end', lineHeight: 1.2 }}>
            <div className="strong small">{me.user.name}</div>
            <div className="xs muted">{me.roles.map((r) => t(r.name)).join(', ')}</div>
          </div>
          <IconButton icon={LogOut} label={t('Sign out')} onClick={logout} />
        </header>
        {!vertical && !mobile && pos === 'top' && horizontalNav}
        {lic && lic.status !== 'active' && (
          <div className={`banner ${lic.status === 'warning' ? '' : 'bad'}`} role="status">
            <TriangleAlert size={16} aria-hidden />
            {lic.status === 'warning' ? t('The licence expires in {n} days. Renew it in Licensing to avoid interruption.', { n: lic.daysLeft }) : t('Licence {s}: {r}', { s: t(lic.status), r: lic.reason || '' })}
          </div>
        )}
        <main id="content" tabIndex={-1}><Outlet /></main>
      </div>
      {!vertical && !mobile && pos === 'bottom' && horizontalNav}
      <Assistant />
    </div>
  );
}
