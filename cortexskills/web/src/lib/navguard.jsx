// Unsaved-changes guard (FR-DA-MRE-09, FR-DA-DEU-06): when a Multi-Entry holds rows not yet saved, leaving the
// page — a link, the browser Back button, closing the task panel or the browser tab — asks first, with three choices:
// Save and leave, Discard and leave, or Stay. Returning from the Full-Screen Entry Workspace to the page never asks,
// because nothing is lost there (FR-DA-MRE-18). Rows are also kept as a browser draft, so a crash loses nothing.
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from './i18n.jsx';
import { Modal, Btn, Icon } from '../components/ui.jsx';

const guards = new Map(); // id → { pending(): { n, errors }, save(): Promise, discard(): void, label }
let ask = null; // set by the host: (reason) => Promise<boolean>
const totals = () => { let n = 0, errors = 0; const labels = []; for (const g of guards.values()) { const p = g.pending(); if (p.n) { n += p.n; errors += p.errors || 0; if (g.label) labels.push(g.label); } } return { n, errors, labels }; };

/** Registers a Multi-Entry while it is on screen. */
export function useNavGuard(id, get) {
  const ref = useRef(get); ref.current = get;
  useEffect(() => { guards.set(id, { pending: () => ref.current().pending(), save: () => ref.current().save(), discard: () => ref.current().discard(), get label() { return ref.current().label; } }); return () => { guards.delete(id); }; }, [id]);
}
/** Resolves true when leaving is fine (nothing pending, or the user chose to save or discard), false to stay. */
export function confirmLeave() { return totals().n && ask ? ask() : Promise.resolve(true); }
export const hasPending = () => totals().n > 0;

/** Mounted once in the application shell: the dialog, link interception and the browser Back sentinel. */
export function NavGuardHost() {
  const { t } = useI18n(); const nav = useNavigate();
  const [open, setOpen] = useState(null); const [busy, setBusy] = useState(false); const [left, setLeft] = useState(0);
  const armed = useRef(false);
  useEffect(() => {
    ask = () => new Promise(resolve => { setLeft(0); setOpen({ resolve, ...totals() }); });
    // In-application links: asked before the route changes.
    const click = e => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest?.('a[href]'); if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      const url = new URL(a.href, location.href); if (url.origin !== location.origin || (url.pathname === location.pathname && url.search === location.search)) return;
      if (!hasPending()) return;
      e.preventDefault(); e.stopPropagation();
      confirmLeave().then(ok => { if (ok) nav(url.pathname + url.search + url.hash); });
    };
    // Browser Back: a sentinel entry is kept while rows are pending (not in the workspace, whose Back returns to the page).
    const arm = () => { if (hasPending() && !armed.current && !document.querySelector('.ws-full')) { history.pushState({ ...(history.state || {}), csGuard: true }, ''); armed.current = true; } };
    const pop = e => {
      if (!armed.current || e.state?.csGuard || e.state?.entryWorkspace) return;
      armed.current = false;
      if (!hasPending()) { history.back(); return; }
      confirmLeave().then(ok => { if (ok) history.back(); else arm(); });
    };
    const before = e => { if (hasPending()) { e.preventDefault(); e.returnValue = ''; } };
    const tick = setInterval(arm, 800);
    document.addEventListener('click', click, true); window.addEventListener('popstate', pop); window.addEventListener('beforeunload', before);
    return () => { ask = null; clearInterval(tick); document.removeEventListener('click', click, true); window.removeEventListener('popstate', pop); window.removeEventListener('beforeunload', before); };
  }, [nav]);
  if (!open) return null;
  const done = v => { const r = open.resolve; setOpen(null); r(v); };
  const saveAll = async () => {
    setBusy(true);
    try { await Promise.all([...guards.values()].map(g => g.save())); } finally { setBusy(false); }
    const rest = totals(); if (rest.n) { setLeft(rest.n); return; } done(true);
  };
  return (<Modal title={t('guard.title')} onClose={() => done(false)} describedBy="guard-text"
    footer={<><Btn onClick={() => done(false)}>{t('guard.stay')}</Btn><span className="spacer" /><Btn kind="danger" icon="Undo2" onClick={() => { for (const g of guards.values()) g.discard(true); done(true); }}>{t('guard.discard')}</Btn><Btn kind="primary" icon="Save" loading={busy} onClick={saveAll}>{t('guard.save')}</Btn></>}>
    <p id="guard-text" className="small">{t('guard.text', { n: open.n, where: open.labels.join(', ') || t('guard.thisPage') })}</p>
    {open.errors > 0 && <p className="small"><Icon name="CircleAlert" size={14} className="err-ico" /> {t('guard.errors', { n: open.errors })}</p>}
    {left > 0 && <p className="field-error" role="alert"><Icon name="CircleAlert" size={12} />{t('guard.notSaved', { n: left })}</p>}
  </Modal>);
}
