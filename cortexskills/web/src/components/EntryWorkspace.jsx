// Full-Screen Entry Workspace (SRS 1.8 FR-DA-MRE-15 – 18, NFR-DA-UX-20, NFR-DA-PERF-13).
// Wraps any Multi-Entry: the same component instance is laid out full screen (never a copy, never remounted), so
// records, filters, selection, typed values and focus are kept. The records area alone scales with the Zoom
// Controls (50 – 200 %, steps of 10 %); the header, the controls and the dialogs keep their size.
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useI18n } from '../lib/i18n.jsx';
import { useSession } from '../lib/session.jsx';
import { Btn, Icon } from './ui.jsx';

const MIN = 50, MAX = 200, STEP = 10;
const clamp = z => Math.min(MAX, Math.max(MIN, Math.round(z / STEP) * STEP));
const OVERLAY = '.overlay, .drawer, .listbox, .menu[role="dialog"], .tooltip-dialog';

/**
 * children({ full, expand, records }) — `expand` is the Expand action for the Multi-Entry toolbar; `records` are the
 * props of the records area (ref, style, className) that the zoom applies to and that scrolls in the workspace.
 */
export function EntryWorkspace({ id, title, context, meta, actions, onBeforeClose, className = '', children }) {
  const { t } = useI18n(); const { prefs, queuePrefs } = useSession();
  const tp = prefs?.tables?.[id] || {};
  const [full, setFull] = useState(false); const [zoom, setZoomState] = useState(() => clamp(tp.zoom || 100));
  const host = useRef(null); const records = useRef(null); const expandBtn = useRef(null); const lastCell = useRef(null);
  const fullRef = useRef(false); fullRef.current = full; const zoomRef = useRef(zoom); zoomRef.current = zoom;
  const labelId = useId(); const liveId = useId();

  const setZoom = useCallback(z => {
    const v = clamp(z); setZoomState(v);
    if (id) queuePrefs({ tables: { [id]: { ...(prefs?.tables?.[id] || {}), zoom: v } } });
    // Keep the active cell in view when the level changes (FR-DA-MRE-16).
    requestAnimationFrame(() => { const a = document.activeElement; if (a && records.current?.contains(a)) a.scrollIntoView({ block: 'nearest', inline: 'nearest' }); });
  }, [id, prefs, queuePrefs]);
  const fit = useCallback(() => {
    const box = records.current; const content = box?.firstElementChild; if (!box || !content) return;
    const natural = content.scrollWidth * (100 / zoomRef.current); if (!natural) return;
    setZoom(Math.floor(((box.clientWidth - 2) / natural) * 100 / STEP) * STEP);
  }, [setZoom]);

  const open = useCallback(() => {
    const a = document.activeElement; lastCell.current = a && host.current?.contains(a) && a !== expandBtn.current ? a : null;
    window.history.pushState({ ...(window.history.state || {}), entryWorkspace: id || true }, '');
    setFull(true);
  }, [id]);
  const close = useCallback(() => {
    onBeforeClose?.(); setFull(false);
    requestAnimationFrame(() => { const c = lastCell.current; if (c && document.contains(c)) { c.focus({ preventScroll: true }); c.scrollIntoView({ block: 'nearest' }); } else expandBtn.current?.focus(); });
  }, [onBeforeClose]);
  const back = useCallback(() => { if (window.history.state?.entryWorkspace) window.history.back(); else close(); }, [close]);

  // While open: browser Back returns; Escape returns once no cell edit, menu or dialog is left to close
  // (innermost first — FR-DA-MRE-18, NFR-DA-FOC-03); the shell sits under the workspace; focus moves to the active cell.
  useEffect(() => {
    if (!full) return undefined;
    const pop = () => { if (fullRef.current) close(); };
    const esc = e => { if (e.key !== 'Escape' || e.defaultPrevented || document.querySelector(OVERLAY)) return; e.preventDefault(); back(); };
    window.addEventListener('popstate', pop); document.addEventListener('keydown', esc);
    document.body.classList.add('aiv-ws-open');
    requestAnimationFrame(() => { const c = lastCell.current; const target = c && document.contains(c) ? c : records.current?.querySelector('input:not([type="checkbox"]):not([disabled]), textarea:not([disabled]), button.select-btn, [tabindex="0"]'); (target || host.current)?.focus({ preventScroll: false }); });
    return () => { window.removeEventListener('popstate', pop); document.removeEventListener('keydown', esc); document.body.classList.remove('aiv-ws-open'); };
  }, [full, close, back]);
  // Remember the last active cell, so focus returns to it (FR-DA-MRE-18).
  useEffect(() => { const el = host.current; if (!el) return undefined; const f = e => { if (records.current?.contains(e.target)) lastCell.current = e.target; }; el.addEventListener('focusin', f); return () => el.removeEventListener('focusin', f); }, []);
  // Ctrl/Cmd + scroll or trackpad pinch zooms; a plain wheel scrolls as on the page. Touch pinch on touch screens.
  useEffect(() => {
    const el = records.current; if (!el || !full) return undefined;
    const wheel = e => { if (!(e.ctrlKey || e.metaKey)) return; e.preventDefault(); setZoom(zoomRef.current + (e.deltaY < 0 ? STEP : -STEP)); };
    let start = null; const dist = ts => Math.hypot(ts[0].clientX - ts[1].clientX, ts[0].clientY - ts[1].clientY);
    const ts = e => { if (e.touches.length === 2) start = { d: dist(e.touches), z: zoomRef.current }; };
    const tm = e => { if (e.touches.length === 2 && start) { e.preventDefault(); setZoom(start.z * (dist(e.touches) / start.d)); } };
    const te = () => { start = null; };
    el.addEventListener('wheel', wheel, { passive: false }); el.addEventListener('touchstart', ts, { passive: true }); el.addEventListener('touchmove', tm, { passive: false }); el.addEventListener('touchend', te);
    return () => { el.removeEventListener('wheel', wheel); el.removeEventListener('touchstart', ts); el.removeEventListener('touchmove', tm); el.removeEventListener('touchend', te); };
  }, [full, setZoom]);
  // Ctrl/Cmd + Shift + F opens the workspace of the Multi-Entry that has focus (Table 4.49-1).
  const onKeyDown = e => { if (!full && (e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'f') { e.preventDefault(); open(); } };

  const expand = <button ref={expandBtn} type="button" className="btn ghost sm icon ws-expand" aria-label={t('ws.open')} data-tip={t('ws.open')} onClick={open} hidden={full}><Icon name="Maximize2" size={24} /></button>;
  const recordsProps = { ref: records, style: full && zoom !== 100 ? { zoom: zoom / 100 } : undefined, className: full ? 'ws-records' : '' };

  return (<div ref={host} className={`ws-host ${full ? 'ws-full' : ''} ${className}`} role={full ? 'dialog' : undefined} aria-modal={full || undefined} aria-labelledby={full ? labelId : undefined} onKeyDown={onKeyDown}>
    {full && <header className="ws-bar">
      <div className="ws-title"><span id={labelId} className="ws-name">{title || t('ws.title')}</span>{(context || meta) && <span className="ws-meta">{[context, meta].filter(Boolean).map((x, i) => <span key={i}>{x}</span>)}</span>}</div>
      <span className="spacer" />
      <div className="ws-zoom" role="group" aria-label={t('ws.zoom')}>
        <Btn size="sm" kind="ghost" icon="ZoomOut" aria-label={t('ws.zoomOut')} disabled={zoom <= MIN} onClick={() => setZoom(zoom - STEP)} />
        <input type="range" className="ws-slider" min={MIN} max={MAX} step={STEP} value={zoom} aria-label={t('ws.zoomLevel')} aria-valuetext={`${zoom} %`} onChange={e => setZoom(Number(e.target.value))} />
        <Btn size="sm" kind="ghost" icon="ZoomIn" aria-label={t('ws.zoomIn')} disabled={zoom >= MAX} onClick={() => setZoom(zoom + STEP)} />
        <output id={liveId} className="ws-level" aria-live="polite">{zoom} %</output>
        <Btn size="sm" kind="ghost" icon="Scan" onClick={fit}>{t('ws.fit')}</Btn>
        <Btn size="sm" kind="ghost" icon="RotateCcw" disabled={zoom === 100} onClick={() => setZoom(100)}>{t('ws.reset')}</Btn>
      </div>
      {actions}
      <Btn kind="primary" icon={document.dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft'} onClick={back}>{t('ws.return')}</Btn>
    </header>}
    {children({ full, expand, records: recordsProps, zoom })}
  </div>);
}
