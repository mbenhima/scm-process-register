import { useEffect, useState } from 'react'

// Persists where the nav menu docks (left/right/top/bottom) and whether it's
// pinned open (always visible, in-flow) or set to auto-hide as a slide-out
// drawer (collapsed to a thin rail, expands on hover/focus, overlays content).
const KEY = 'dba_layout_prefs'
const DEFAULTS = { position: 'left', pinned: true }

export function useLayoutPrefs() {
  const [prefs, setPrefs] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(KEY) || '{}')
      return { ...DEFAULTS, ...stored }
    } catch {
      return DEFAULTS
    }
  })

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(prefs)) } catch { /* private browsing, etc. */ }
  }, [prefs])

  return {
    position: prefs.position, // 'left' | 'right' | 'top' | 'bottom'
    pinned: prefs.pinned,
    setPosition: (position) => setPrefs((p) => ({ ...p, position })),
    togglePinned: () => setPrefs((p) => ({ ...p, pinned: !p.pinned })),
  }
}
