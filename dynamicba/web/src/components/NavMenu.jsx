import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Building2, FolderKanban, ClipboardList, Network, ShieldCheck,
  BarChart3, Sparkles, Trash2, HelpCircle, Settings, LogOut, ChevronDown,
  Pin, PinOff, PanelLeft, PanelRight, PanelTop, PanelBottom,
} from 'lucide-react'
import { PLAN_LABELS } from '../lib/catalogue'

const NAV = [
  { to: '/dashboard', key: 'nav_dashboard', icon: LayoutDashboard },
  { to: '/clients', key: 'nav_clients', icon: Building2 },
  { to: '/projects', key: 'nav_projects', icon: FolderKanban },
  { to: '/workspace', key: 'nav_workspace', icon: ClipboardList },
  { to: '/catalogue', key: 'nav_catalogue', icon: Network },
  { to: '/governance', key: 'nav_governance', icon: ShieldCheck },
  { to: '/reports', key: 'nav_reports', icon: BarChart3 },
  { to: '/ai-use-cases', key: 'nav_ai', icon: Sparkles },
  { to: '/recycle', key: 'nav_recyclebin', icon: Trash2 },
  { to: '/help', key: 'nav_help', icon: HelpCircle },
]

const POSITIONS = [
  { id: 'left', icon: PanelLeft, label: 'Dock left' },
  { id: 'right', icon: PanelRight, label: 'Dock right' },
  { id: 'top', icon: PanelTop, label: 'Dock top' },
  { id: 'bottom', icon: PanelBottom, label: 'Dock bottom' },
]

const RAIL = 56 // collapsed thickness (px) when unpinned and not hovered
const VERTICAL_EXPANDED = 256 // w-64

function navLinkClass(vertical, collapsed) {
  return ({ isActive }) => [
    'flex items-center rounded-lg text-sm font-sans font-medium transition-colors duration-150 shrink-0',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-deep',
    vertical ? 'gap-3 mx-2 px-3 py-2' : `gap-2 px-3 py-2 ${collapsed ? '' : 'whitespace-nowrap'}`,
    isActive ? 'bg-orange-tint text-orange-deep font-semibold' : 'text-grey-ink hover:bg-grey-light hover:text-grey-dark',
  ].join(' ')
}

// The app's nav menu: dockable to any of the 4 screen edges, and either
// pinned open (always visible, in the normal document flow) or unpinned,
// where it collapses to a thin rail and slides out as an overlay on
// hover/focus — like an IDE's auto-hide sidebar — without shifting the
// page's layout while collapsed.
export default function NavMenu({
  position, pinned, onSetPosition, onTogglePinned,
  t, lang, setLang, organization, licence, isAdmin, onLogout,
}) {
  const [hovered, setHovered] = useState(false)
  const vertical = position === 'left' || position === 'right'
  const expanded = pinned || hovered

  const containerBase = 'bg-white flex z-30 transition-[width,height] duration-200 ease-out'
  const edgeClass = {
    left: 'border-r border-grey-line',
    right: 'border-l border-grey-line',
    top: 'border-b border-grey-line',
    bottom: 'border-t border-grey-line',
  }[position]

  const sizeStyle = vertical
    ? { width: expanded ? VERTICAL_EXPANDED : RAIL }
    : { height: expanded ? 'auto' : RAIL }

  const fixedPositionClass = pinned ? 'relative' : {
    left: 'fixed inset-y-0 left-0',
    right: 'fixed inset-y-0 right-0',
    top: 'fixed inset-x-0 top-0',
    bottom: 'fixed inset-x-0 bottom-0',
  }[position]

  const nav = (
    <div
      className={`${containerBase} ${edgeClass} ${fixedPositionClass} ${vertical ? 'flex-col overflow-hidden' : 'flex-row items-center overflow-x-auto'}`}
      style={sizeStyle}
      onMouseEnter={() => !pinned && setHovered(true)}
      onMouseLeave={() => !pinned && setHovered(false)}
      onFocus={() => !pinned && setHovered(true)}
      onBlur={(e) => { if (!pinned && !e.currentTarget.contains(e.relatedTarget)) setHovered(false) }}
    >
      {/* Brand */}
      <div className={vertical ? 'px-4 py-4 border-b border-grey-line shrink-0' : 'px-4 py-2 flex items-center gap-2 shrink-0'}>
        {expanded ? (
          <>
            <div className="font-serif font-bold text-xl text-grey-dark leading-tight whitespace-nowrap">{t('app_name')}</div>
            {vertical && <div className="text-xs text-grey-medium mt-2 truncate">{organization?.name || '—'}</div>}
            {vertical && licence && <span className="badge badge-good mt-2">{PLAN_LABELS[licence.plan] || licence.plan}</span>}
          </>
        ) : (
          <div className="w-8 h-8 rounded-full bg-orange text-white flex items-center justify-center font-serif font-bold text-sm mx-auto">D</div>
        )}
      </div>

      {/* Links */}
      <nav className={vertical ? 'flex-1 overflow-y-auto py-3 space-y-1' : 'flex-1 flex items-center gap-1 overflow-x-auto px-2'}>
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} className={navLinkClass(vertical, !expanded)} title={!expanded ? t(n.key) : undefined}>
            <n.icon size={17} strokeWidth={2} className={`shrink-0 ${!expanded ? 'mx-auto' : ''}`} aria-hidden="true" />
            {expanded && <span className="truncate">{t(n.key)}</span>}
          </NavLink>
        ))}
        {isAdmin && (
          <NavLink to="/admin" className={navLinkClass(vertical, !expanded)} title={!expanded ? t('nav_admin') : undefined}>
            <Settings size={17} strokeWidth={2} className={`shrink-0 ${!expanded ? 'mx-auto' : ''}`} aria-hidden="true" />
            {expanded && <span className="truncate">{t('nav_admin')}</span>}
          </NavLink>
        )}
      </nav>

      {/* Footer: language, logout, and the pin/dock controls */}
      <div className={vertical ? 'px-4 py-4 border-t border-grey-line space-y-3 shrink-0' : 'px-3 py-2 flex items-center gap-2 shrink-0'}>
        {expanded && (
          <div className="relative">
            <select className="input text-xs appearance-none pr-8" value={lang} onChange={(e) => setLang(e.target.value)} aria-label="Language">
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="ar">العربية</option>
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-grey-medium" aria-hidden="true" />
          </div>
        )}
        <button
          onClick={onLogout}
          title={t('nav_logout')}
          className={`btn-ghost text-grey-medium hover:text-grey-dark ${vertical ? 'w-full !justify-start !px-2' : ''}`}
        >
          <LogOut size={16} strokeWidth={2} aria-hidden="true" />
          {expanded && t('nav_logout')}
        </button>

        {expanded && (
          <div className={`flex items-center gap-1 ${vertical ? 'pt-3 mt-1 border-t border-grey-line' : ''}`}>
            {POSITIONS.map((p) => (
              <button
                key={p.id}
                title={p.label}
                aria-label={p.label}
                aria-pressed={position === p.id}
                onClick={() => onSetPosition(p.id)}
                className={`p-1.5 rounded-lg transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-deep ${position === p.id ? 'bg-orange-tint text-orange-deep' : 'text-grey-medium hover:bg-grey-light hover:text-grey-dark'}`}
              >
                <p.icon size={15} strokeWidth={2} aria-hidden="true" />
              </button>
            ))}
            <button
              title={pinned ? 'Unpin (auto-hide as a slide-out drawer)' : 'Pin menu open'}
              aria-label={pinned ? 'Unpin menu' : 'Pin menu open'}
              aria-pressed={pinned}
              onClick={onTogglePinned}
              className={`p-1.5 rounded-lg transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-deep ${pinned ? 'bg-orange-tint text-orange-deep' : 'text-grey-medium hover:bg-grey-light hover:text-grey-dark'}`}
            >
              {pinned ? <Pin size={15} strokeWidth={2} aria-hidden="true" /> : <PinOff size={15} strokeWidth={2} aria-hidden="true" />}
            </button>
          </div>
        )}
      </div>
    </div>
  )

  if (pinned) return nav

  // Unpinned: reserve a rail-sized spacer in the normal flow (so the rest of
  // the layout doesn't shift) while the nav itself is fixed-positioned and
  // slides out over the content on hover/focus.
  const spacerStyle = vertical ? { width: RAIL, height: '100%' } : { height: RAIL, width: '100%' }
  return (
    <>
      <div style={spacerStyle} className="shrink-0" aria-hidden="true" />
      {nav}
    </>
  )
}
