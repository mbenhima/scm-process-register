// Global search (Section 4.37) and Command Palette (FR-DA-NAV-19): a 640 px overlay opened with Ctrl+K / ⌘K, from the
// Search button of the menu or the header search bar. Results show an icon, the label, a type badge and the shortcut;
// arrow keys move, Enter opens, Escape closes. Menu commands ("Go to …") have two-key shortcuts (G then a letter).
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../lib/i18n.jsx';
import { useSession } from '../lib/session.jsx';
import { get } from '../lib/api.js';
import { Icon, Btn, StatusPill, Select } from './ui.jsx';
import { createPortal } from 'react-dom';

const TYPES = ['project', 'questionnaire', 'training', 'record', 'governance', 'process', 'ai', 'report', 'document', 'people', 'help'];
const ICON = { project: 'FolderKanban', questionnaire: 'ClipboardList', training: 'GraduationCap', record: 'Database', governance: 'ShieldCheck', process: 'Workflow', ai: 'Sparkles', report: 'FileText', document: 'FileStack', people: 'Users', help: 'LifeBuoy', command: 'CornerDownRight' };
export const SHORTCUTS = { dashboard: 'D', myTasks: 'T', projects: 'P', questionnaires: 'Q', trainingPlan: 'L', documents: 'O', reports: 'R', alerts: 'A', settings: 'S', help: 'H', processDesign: 'E', obs: 'U', auditProgram: 'I' };

export function openSearch(q = '') { document.dispatchEvent(new CustomEvent('search:open', { detail: q })); }

export function HeaderSearch() {
  const { t } = useI18n(); const [q, setQ] = useState('');
  return (<form className="header-search hide-mobile" role="search" onSubmit={e => { e.preventDefault(); openSearch(q); setQ(''); }}>
    <Icon name="Search" /><input className="input" value={q} onChange={e => { setQ(e.target.value); if (e.target.value.length >= 2) { openSearch(e.target.value); setQ(''); } }} placeholder={t('search.placeholder')} aria-label={t('search.placeholder')} /><kbd>Ctrl K</kbd></form>);
}

const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
function highlight(text, words) {
  const s = String(text || ''); if (!words.length) return s; const base = norm(s); if (base.length !== s.length) return s;
  const hits = []; for (const w of words) { let i = base.indexOf(w); while (i >= 0) { hits.push([i, i + w.length]); i = base.indexOf(w, i + w.length); } }
  if (!hits.length) return s; hits.sort((a, b) => a[0] - b[0]); const out = []; let at = 0;
  hits.forEach(([a, b], k) => { if (a < at) return; out.push(s.slice(at, a), <mark key={k}>{s.slice(a, b)}</mark>); at = b; }); out.push(s.slice(at)); return out;
}

export function SearchDialog() {
  const { t } = useI18n(); const { me, nav, savePrefs, project } = useSession(); const navigate = useNavigate();
  const [open, setOpen] = useState(false); const [q, setQ] = useState(''); const [types, setTypes] = useState([]); const [scope, setScope] = useState('org'); const [status, setStatus] = useState(''); const [since, setSince] = useState('');
  const [res, setRes] = useState(null); const [busy, setBusy] = useState(false); const [cur, setCur] = useState(0); const seq = useRef(0); const box = useRef(null); const gPressed = useRef(0);
  useEffect(() => {
    const k = e => {
      const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen(true); return; }
      if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key.toLowerCase() === 'g') { gPressed.current = Date.now(); return; }
      if (Date.now() - gPressed.current < 1200) { const id = Object.keys(SHORTCUTS).find(x => SHORTCUTS[x] === e.key.toUpperCase()); const item = id && nav?.items.find(i => i.id === id); if (item) { e.preventDefault(); gPressed.current = 0; navigate(item.route); } }
    };
    const o = e => { setOpen(true); if (e.detail) setQ(e.detail); };
    document.addEventListener('keydown', k); document.addEventListener('search:open', o);
    return () => { document.removeEventListener('keydown', k); document.removeEventListener('search:open', o); };
  }, [nav, navigate]);
  useEffect(() => {
    if (!open || q.trim().length < 2) { setRes(null); return undefined; }
    const id = ++seq.current; setBusy(true);
    const params = new URLSearchParams({ q: q.trim() }); if (types.length) params.set('types', types.join(',')); if (scope === 'project' && project) params.set('project', project); if (status) params.set('status', status); if (since) params.set('since', since);
    const h = setTimeout(() => get('/search?' + params).then(r => { if (id === seq.current) setRes(r); }).catch(() => {}).finally(() => id === seq.current && setBusy(false)), 180);
    return () => clearTimeout(h);
  }, [q, types, scope, status, since, open, project]);
  useEffect(() => { if (!open) return undefined; const k = e => { if (e.key === 'Escape') { e.preventDefault(); setOpen(false); } }; document.addEventListener('keydown', k); return () => document.removeEventListener('keydown', k); }, [open]);
  const words = norm(q.trim()).split(/\s+/).filter(w => w.length > 1);
  const commands = useMemo(() => { if (!nav) return []; const s = norm(q.trim()); return nav.items.filter(i => !s || norm(t(i.label)).includes(s)).slice(0, s ? 6 : 8).map(i => ({ id: 'cmd-' + i.id, title: t(i.label), route: i.route, icon: i.icon, type: 'command', meta: t('navGroup.' + i.group), shortcut: SHORTCUTS[i.id] ? `G ${SHORTCUTS[i.id]}` : null })); }, [nav, q, t]);
  const flat = useMemo(() => [...commands, ...(res?.groups || []).flatMap(g => g.items.map(it => ({ ...it, type: g.type })))], [commands, res]);
  useEffect(() => setCur(0), [res, q]);
  if (!open) return null;
  const recent = me?.prefs?.recentSearches || [];
  const close = () => { setOpen(false); };
  const go = item => { if (item.type !== 'command') { const r = [q.trim(), ...recent.filter(x => x !== q.trim())].filter(Boolean).slice(0, 10); savePrefs({ recentSearches: r }).catch(() => {}); } close(); setQ(''); navigate(item.route); };
  const onKey = e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (!flat.length) return; const n = (cur + (e.key === 'ArrowDown' ? 1 : -1) + flat.length) % flat.length; setCur(n); box.current?.querySelector('#hit-' + n)?.scrollIntoView({ block: 'nearest' }); }
    else if (e.key === 'Enter' && flat[cur]) { e.preventDefault(); go(flat[cur]); }
  };
  let idx = -1;
  const hit = it => { idx += 1; const n = idx; return <button key={it.type + (it.id || '') + (it.entity || '') + n} id={'hit-' + n} role="option" aria-selected={n === cur} type="button" className={`search-hit ${n === cur ? 'on' : ''}`} onMouseMove={() => setCur(n)} onClick={() => go(it)}>
    <Icon name={it.icon || ICON[it.type]} size={20} className="hit-ico" />
    <span className="hit-main"><span className="hit-title">{it.code && <span className="mono">{highlight(it.code, words)} · </span>}{highlight(it.title, words)}</span><span className="hit-meta">{[it.entity && t('search.entity.' + it.entity) !== 'search.entity.' + it.entity ? t('search.entity.' + it.entity) : it.entity, it.location || it.meta].filter(Boolean).join(' · ')}</span></span>
    <span>{it.status ? <StatusPill value={it.status} /> : <span className="pill outline">{t(it.type === 'command' ? 'search.type.command' : 'search.type.' + it.type)}</span>}</span>
    <span>{it.shortcut ? <kbd>{it.shortcut}</kbd> : n === cur ? <kbd>↵</kbd> : null}</span></button>; };
  return createPortal(<div className="overlay" onMouseDown={e => e.target === e.currentTarget && close()}><div className="dialog palette" role="dialog" aria-modal="true" aria-label={t('search.title')} ref={box}>
    <div className="palette-top"><Icon name="Search" size={20} /><input autoFocus className="input" value={q} onChange={e => setQ(e.target.value)} onKeyDown={onKey} placeholder={t('search.placeholder')} aria-label={t('search.placeholder')} role="combobox" aria-expanded="true" aria-controls="palette-list" aria-activedescendant={flat.length ? 'hit-' + cur : undefined} />{busy && <span className="xs muted">{t('common.loading')}</span>}<Btn icon="X" kind="ghost" size="sm" aria-label={t('common.close')} onClick={close} /></div>
    <div className="row palette-filters">{TYPES.map(ty => <button key={ty} type="button" className={`chip ${types.includes(ty) ? 'on' : ''}`} aria-pressed={types.includes(ty)} onClick={() => setTypes(s => (s.includes(ty) ? s.filter(x => x !== ty) : [...s, ty]))}><Icon name={ICON[ty]} size={14} />{t('search.type.' + ty)}{res?.counts?.[ty] ? ` · ${res.counts[ty]}` : ''}</button>)}
      {project && <Select size="sm" aria-label={t('search.scope')} value={scope} onChange={e => setScope(e.target.value)} options={[{ value: 'org', label: t('search.scopeOrg') }, { value: 'project', label: t('search.scopeProject') }]} />}
      <Select size="sm" aria-label={t('search.status')} value={status} onChange={e => setStatus(e.target.value)} options={[{ value: '', label: t('search.anyStatus') }, ...['Draft', 'In progress', 'Completed', 'Approved', 'Published', 'Open', 'Closed', 'Blocked'].map(s => ({ value: s, label: t('status.' + s) }))]} />
      <Select size="sm" aria-label={t('search.since')} value={since} onChange={e => setSince(e.target.value)} options={[{ value: '', label: t('search.anyDate') }, { value: '7', label: t('search.days', { n: 7 }) }, { value: '30', label: t('search.days', { n: 30 }) }, { value: '90', label: t('search.days', { n: 90 }) }, { value: '365', label: t('search.days', { n: 365 }) }]} /></div>
    <div className="palette-results" id="palette-list" role="listbox" aria-label={t('search.results')}>
      {commands.length > 0 && <section className="palette-group"><div className="eyebrow">{t('search.commands')}</div>{commands.map(hit)}</section>}
      {!res && q.trim().length < 2 && <div>{recent.length > 0 && <><div className="eyebrow">{t('search.recent')}</div><div className="row">{recent.map(r => <button key={r} type="button" className="chip" onClick={() => setQ(r)}><Icon name="History" size={14} />{r}</button>)}</div></>}<p className="small muted" style={{ marginTop: 'var(--aiv-space-3)' }}>{t('search.hint')}</p></div>}
      {res && !res.groups.length && <p className="muted">{t('search.none', { q: res.q })}</p>}
      {res?.groups.map(g => <section key={g.type} className="palette-group"><div className="eyebrow">{t('search.type.' + g.type)} · {res.counts[g.type]}</div>{g.items.map(it => hit({ ...it, type: g.type }))}</section>)}
      {res && res.total > 60 && <p className="xs muted">{t('search.more', { n: res.total - 60 })}</p>}
    </div>
    <div className="palette-foot"><span><kbd>↑</kbd> <kbd>↓</kbd> {t('search.kbMove')}</span><span><kbd>↵</kbd> {t('search.kbOpen')}</span><span><kbd>Esc</kbd> {t('search.kbClose')}</span><span><kbd>G</kbd> + <kbd>D</kbd> {t('search.kbGo')}</span></div>
  </div></div>, document.body);
}
