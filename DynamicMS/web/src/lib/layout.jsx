// Resizable layout panels (AI Value graphical chart §16): the left navigation and the right
// context panel are resized by drag or keyboard; the centre fills the remaining space.
// Widths persist in localStorage under one key and are clamped to their min / max on load.
import { useCallback, useEffect, useRef, useState } from 'react';

const KEY = 'layout.panelWidths';
export const PANELS = {
  left: { def: 260, min: 180, max: 480 },
  right: { def: 320, min: 220, max: 560 },
};
const CENTER_MIN = 400;
const MOBILE = 768;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function readWidths() {
  let w = {};
  try { w = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { w = {}; }
  return {
    leftWidth: clamp(Number(w.leftWidth) || PANELS.left.def, PANELS.left.min, PANELS.left.max),
    rightWidth: clamp(Number(w.rightWidth) || PANELS.right.def, PANELS.right.min, PANELS.right.max),
  };
}
export function writeWidths(w) { try { localStorage.setItem(KEY, JSON.stringify(w)); } catch { /* storage blocked */ } }
export function resetWidths() { try { localStorage.removeItem(KEY); } catch { /* storage blocked */ } }

// Keeps the centre at its minimum width when the window shrinks.
function fit(side, value, other) {
  const room = window.innerWidth - CENTER_MIN - (other || 0);
  const p = PANELS[side];
  return clamp(Math.min(value, Math.max(p.min, room)), p.min, p.max);
}

export function usePanelWidth(side) {
  const name = side === 'left' ? 'leftWidth' : 'rightWidth';
  const [width, setWidth] = useState(() => readWidths()[name]);
  const set = useCallback((v) => {
    setWidth(() => {
      const w = readWidths();
      const next = fit(side, v, side === 'left' ? 0 : w.leftWidth);
      writeWidths({ ...w, [name]: next });
      return next;
    });
  }, [side, name]);
  useEffect(() => {
    const onResize = () => setWidth(w => fit(side, w, side === 'left' ? 0 : readWidths().leftWidth));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [side]);
  return [width, set];
}

/** Drag handle with role="separator": drag, ← / → by 16 px, Home / End to min / max,
 *  double-click to reset. `atStart` puts the handle on the panel's start edge (right panel). */
export function ResizeHandle({ side, width, onChange, label, className = '', atStart = side === 'right' }) {
  const p = PANELS[side];
  const start = useRef(null);
  const rtl = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';
  // Dragging right widens the left panel and narrows the right one (mirrored under RTL).
  const sign = (atStart ? -1 : 1) * (rtl ? -1 : 1);
  const onPointerDown = (e) => {
    if (window.innerWidth < MOBILE) return;
    e.preventDefault();
    start.current = { x: e.clientX, w: width };
    document.body.classList.add('is-resizing');
    const move = (ev) => onChange(start.current.w + sign * (ev.clientX - start.current.x));
    const up = () => {
      document.body.classList.remove('is-resizing');
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  const onKeyDown = (e) => {
    const step = { ArrowRight: 16 * sign, ArrowLeft: -16 * sign }[e.key];
    if (step) { e.preventDefault(); onChange(width + step); }
    if (e.key === 'Home') { e.preventDefault(); onChange(p.min); }
    if (e.key === 'End') { e.preventDefault(); onChange(p.max); }
  };
  return (
    <div
      className={`resize-handle resize-${side} ${className}`}
      role="separator"
      aria-orientation="vertical"
      aria-valuenow={Math.round(width)}
      aria-valuemin={p.min}
      aria-valuemax={p.max}
      aria-label={label}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      onDoubleClick={() => onChange(p.def)}
    />
  );
}

/** Main content and a resizable right context panel (chart §16). Children: [main, aside]. */
export function Split({ children, label = 'Resize context panel' }) {
  const [w, setW] = usePanelWidth('right');
  const [main, aside] = Array.isArray(children) ? children : [children, null];
  return (
    <div className="split" style={{ '--aside-w': `${w}px` }}>
      <div className="split-main">{main}</div>
      {aside && <aside className="split-aside"><ResizeHandle side="right" width={w} onChange={setW} label={label} />{aside}</aside>}
    </div>
  );
}
