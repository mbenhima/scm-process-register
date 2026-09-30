// Global search (FR-DA-SRCH): opened from the Search button of the menu or Ctrl/Cmd+K.
// Results are grouped by type, respect the user's rights, and open on their own screen.
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { useApp } from '../lib/state.jsx';
import { api } from '../lib/api.js';
import { tx, Status } from './ui.jsx';

const RECENT = 'dms.recentSearches';
const readRecent = () => { try { return JSON.parse(localStorage.getItem(RECENT) || '[]'); } catch { return []; } };

export default function SearchModal({ initial = '', onClose }) {
  const { t, lang, projectId } = useApp();
  const navigate = useNavigate();
  const [q, setQ] = useState(initial);
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const [type, setType] = useState('');
  const [cursor, setCursor] = useState(0);
  const input = useRef(null);
  useEffect(() => { input.current?.focus(); }, []);
  useEffect(() => {
    if (q.trim().length < 2) { setRes(null); return undefined; }
    setBusy(true);
    const h = setTimeout(() => {
      api(`/search?q=${encodeURIComponent(q.trim())}${projectId ? `&projectId=${projectId}` : ''}&limit=10`).then(r => { setRes(r); setCursor(0); }).catch(() => setRes({ groups: [], total: 0 })).finally(() => setBusy(false));
    }, 200);
    return () => clearTimeout(h);
  }, [q, projectId]);
  const groups = (res?.groups || []).filter(g => !type || g.type === type);
  const flat = groups.flatMap(g => g.items);
  const open = (it) => {
    try { localStorage.setItem(RECENT, JSON.stringify([q.trim(), ...readRecent().filter(x => x !== q.trim())].slice(0, 8))); } catch { /* storage unavailable */ }
    onClose(); navigate(it.link);
  };
  const onKey = (e) => {
    if (e.key === 'Escape') onClose();
    else if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(flat.length - 1, c + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor(c => Math.max(0, c - 1)); }
    else if (e.key === 'Enter' && flat[cursor]) open(flat[cursor]);
  };
  const mark = (s) => {
    const str = String(tx(s, lang) ?? '');
    const words = q.trim().split(/\s+/).filter(w => w.length > 1).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (!words.length) return str;
    const parts = str.split(new RegExp(`(${words.join('|')})`, 'ig'));
    return parts.map((p, i) => (i % 2 ? <mark key={i}>{p}</mark> : p));
  };
  let idx = -1;
  return (
    <div className="search-overlay" role="dialog" aria-modal="true" aria-label={t('Search')} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="search-panel" onKeyDown={onKey}>
        <div className="search-input">
          <Search size={18} aria-hidden="true" />
          <input ref={input} value={q} onChange={e => setQ(e.target.value)} placeholder={t('Search steps, records, documents, people, help…')} aria-label={t('Search')} />
          <button className="btn btn-ghost btn-icon btn-sm" aria-label={t('Close')} onClick={onClose}><X size={16} /></button>
        </div>
        {res && res.groups.length > 1 && (
          <div className="search-filters" role="group" aria-label={t('Filter by type')}>
            <button className={`chip ${!type ? 'on' : ''}`} onClick={() => setType('')}>{t('All')} ({res.total})</button>
            {res.groups.map(g => <button key={g.type} className={`chip ${type === g.type ? 'on' : ''}`} onClick={() => setType(g.type)}>{tx(g.label, lang)} ({g.total})</button>)}
          </div>
        )}
        <div className="search-results">
          {q.trim().length < 2 && (
            <div className="stack-8">
              <p className="small muted">{t('Type at least 2 characters. Codes (MP-001.2, NC-…) are matched exactly.')} {t('Shortcut: Ctrl+K.')}</p>
              {readRecent().length > 0 && <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}><span className="xsmall muted">{t('Recent searches')}:</span>{readRecent().map(r => <button key={r} className="chip" onClick={() => setQ(r)}>{r}</button>)}</div>}
            </div>
          )}
          {busy && !res && <p className="small muted">{t('Searching…')}</p>}
          {res && !groups.length && <p className="small muted">{t('No result for "{q}".', { q })}</p>}
          {groups.map(g => (
            <section key={g.type}>
              <h3 className="search-group">{tx(g.label, lang)} <span className="muted">· {g.total}</span></h3>
              <ul className="search-list">
                {g.items.map(it => { idx += 1; const me = idx; return (
                  <li key={`${g.type}-${it.id}`}>
                    <button className={`search-item ${cursor === me ? 'active' : ''}`} onMouseEnter={() => setCursor(me)} onClick={() => open(it)}>
                      {it.code && <span className="mono xsmall muted">{mark(it.code)}</span>}
                      <span className="strong small">{mark(it.title)}</span>
                      {it.sub && <span className="xsmall muted">{tx(it.sub, lang)}</span>}
                      {it.status && <Status value={it.status} />}
                    </button>
                  </li>
                ); })}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
