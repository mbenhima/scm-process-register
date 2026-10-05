// Global search (SRS 4.37, FR-DA-NAV-12/14): a search bar in the header of every screen, a Search button in the menu
// and the Ctrl+K / ⌘K shortcut open one dialog; results are grouped by type, filterable, and open on their own screen.
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../lib/i18n.jsx';
import { useSession } from '../lib/session.jsx';
import { get } from '../lib/api.js';
import { Icon, Btn, StatusPill } from './ui.jsx';

const TYPES = ['project', 'questionnaire', 'training', 'record', 'governance', 'process', 'ai', 'report', 'people', 'help'];
const ICON = { project: 'FolderKanban', questionnaire: 'ClipboardList', training: 'GraduationCap', record: 'Database', governance: 'ShieldCheck', process: 'Workflow', ai: 'Sparkles', report: 'FileText', people: 'Users', help: 'LifeBuoy' };

export function openSearch(q = '') { document.dispatchEvent(new CustomEvent('search:open', { detail: q })); }

export function HeaderSearch() {
  const { t } = useI18n(); const [q, setQ] = useState('');
  return (<form className="header-search hide-mobile" role="search" onSubmit={e => { e.preventDefault(); openSearch(q); setQ(''); }}>
    <Icon name="Search" /><input className="input" value={q} onChange={e => setQ(e.target.value)} onFocus={() => { if (!q) openSearch(''); }} placeholder={t('search.placeholder')} aria-label={t('search.placeholder')} /><kbd>Ctrl K</kbd></form>);
}

export function SearchDialog() {
  const { t, L } = useI18n(); const { me, savePrefs, project } = useSession(); const nav = useNavigate();
  const [open, setOpen] = useState(false); const [q, setQ] = useState(''); const [types, setTypes] = useState([]); const [scope, setScope] = useState('org'); const [res, setRes] = useState(null); const [busy, setBusy] = useState(false); const [cur, setCur] = useState(0); const inp = useRef(null); const seq = useRef(0);
  useEffect(() => {
    const k = e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen(true); } if (e.key === 'Escape') setOpen(false); };
    const o = e => { setOpen(true); if (e.detail) setQ(e.detail); };
    document.addEventListener('keydown', k); document.addEventListener('search:open', o);
    return () => { document.removeEventListener('keydown', k); document.removeEventListener('search:open', o); };
  }, []);
  useEffect(() => { if (open) setTimeout(() => inp.current?.focus(), 30); }, [open]);
  useEffect(() => {
    if (!open || q.trim().length < 2) { setRes(null); return; }
    const id = ++seq.current; setBusy(true);
    const h = setTimeout(() => get(`/search?q=${encodeURIComponent(q.trim())}${types.length ? '&types=' + types.join(',') : ''}${scope === 'project' && project ? '&project=' + project : ''}`).then(r => { if (id === seq.current) setRes(r); }).catch(() => {}).finally(() => id === seq.current && setBusy(false)), 220);
    return () => clearTimeout(h);
  }, [q, types, scope, open, project]);
  useEffect(() => setCur(0), [res]);
  if (!open) return null;
  const flat = (res?.groups || []).flatMap(g => g.items);
  const onKey = e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (!flat.length) return; const n = (cur + (e.key === 'ArrowDown' ? 1 : -1) + flat.length) % flat.length; setCur(n); document.getElementById('hit-' + n)?.scrollIntoView({ block: 'nearest' }); }
    else if (e.key === 'Enter' && flat[cur]) { e.preventDefault(); go(flat[cur]); }
  };
  const words = q.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/\s+/).filter(w => w.length > 1);
  const mark = text => { const s = String(text || ''); if (!words.length) return s; const base = s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); if (base.length !== s.length) return s;
    const hits = []; for (const w of words) { let i = base.indexOf(w); while (i >= 0) { hits.push([i, i + w.length]); i = base.indexOf(w, i + w.length); } }
    if (!hits.length) return s; hits.sort((a, b) => a[0] - b[0]); const out = []; let at = 0;
    hits.forEach(([a, b], k) => { if (a < at) return; out.push(s.slice(at, a), <mark key={k}>{s.slice(a, b)}</mark>); at = b; }); out.push(s.slice(at)); return out; };
  let idx = -1;
  const recent = me?.prefs?.recentSearches || [];
  const go = item => { const r = [q.trim(), ...recent.filter(x => x !== q.trim())].filter(Boolean).slice(0, 10); savePrefs({ recentSearches: r }).catch(() => {}); setOpen(false); setQ(''); nav(item.route); };
  return (<div className="overlay" onMouseDown={e => e.target === e.currentTarget && setOpen(false)}><div className="dialog wide search-dialog" role="dialog" aria-modal="true" aria-label={t('search.title')}>
    <div className="search-top"><Icon name="Search" /><input ref={inp} autoFocus className="input" value={q} onChange={e => setQ(e.target.value)} onKeyDown={onKey} placeholder={t('search.placeholder')} aria-label={t('search.placeholder')} aria-activedescendant={flat.length ? 'hit-' + cur : undefined} />{busy && <span className="xs muted">{t('common.loading')}</span>}<Btn icon="X" kind="ghost" aria-label={t('common.close')} onClick={() => setOpen(false)} /></div>
    <div className="row search-filters">{TYPES.map(ty => <button key={ty} type="button" className={`chip ${types.includes(ty) ? 'on' : ''}`} aria-pressed={types.includes(ty)} onClick={() => setTypes(s => (s.includes(ty) ? s.filter(x => x !== ty) : [...s, ty]))}><Icon name={ICON[ty]} size={12} />{t('search.type.' + ty)}{res?.counts?.[ty] ? ` · ${res.counts[ty]}` : ''}</button>)}
      {project && <select className="input" style={{ width: 'auto' }} value={scope} onChange={e => setScope(e.target.value)} aria-label={t('search.scope')}><option value="org">{t('search.scopeOrg')}</option><option value="project">{t('search.scopeProject')}</option></select>}</div>
    <div className="search-results">
      {!res && <div>{recent.length > 0 && <><div className="eyebrow">{t('search.recent')}</div><div className="row">{recent.map(r => <button key={r} type="button" className="chip" onClick={() => setQ(r)}><Icon name="History" size={12} />{r}</button>)}</div></>}<p className="small muted">{t('search.hint')}</p></div>}
      {res && !res.groups.length && <p className="muted">{t('search.none', { q: res.q })}</p>}
      {res?.groups.map(g => <section key={g.type}><div className="eyebrow"><Icon name={ICON[g.type]} size={12} /> {t('search.type.' + g.type)} · {res.counts[g.type]}</div>
        {g.items.map(it => { idx += 1; const n = idx; return <button key={g.type + it.id + (it.entity || '')} id={'hit-' + n} type="button" className={`search-hit ${n === cur ? 'on' : ''}`} onMouseEnter={() => setCur(n)} onClick={() => go(it)}>
          <span className="mono xs">{mark(it.code || '')}</span><span className="strong small">{mark(it.title)}</span><span className="xs muted">{[it.entity && t('search.entity.' + it.entity) !== 'search.entity.' + it.entity ? t('search.entity.' + it.entity) : it.entity, it.location].filter(Boolean).join(' · ')}</span>{it.status && <StatusPill value={it.status} />}</button>; })}</section>)}
      {res && res.total > 60 && <p className="xs muted">{t('search.more', { n: res.total - 60 })}</p>}
    </div></div></div>);
}
