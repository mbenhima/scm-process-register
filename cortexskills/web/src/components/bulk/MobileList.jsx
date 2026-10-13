// Phone fallback of the bulk-entry grid: below 768 px no grid is shown; the rows are listed read-only, and "Edit one
// by one" opens the Row Editor, which loops through the rows (previous, next, Save and new). Import stays available.
import { useEffect, useState } from 'react';
import { Btn, Icon } from '../ui.jsx';
import { StatusMark } from './GridParts.jsx';

const QUERY = '(max-width: 767px)';
export function useNarrow() {
  const get = () => typeof window !== 'undefined' && !!window.matchMedia?.(QUERY).matches;
  const [narrow, setNarrow] = useState(get);
  useEffect(() => { const m = window.matchMedia?.(QUERY); if (!m) return undefined; const f = () => setNarrow(m.matches); m.addEventListener('change', f); return () => m.removeEventListener('change', f); }, []);
  return narrow;
}

export function MobileList({ rows, columns, readOnly, title, onOpen, onAdd, onImport, t }) {
  const show = (c, v) => (v == null || v === '' ? '—' : c.type === 'boolean' ? (v === true || v === 'true' ? t('common.yes') : t('common.no')) : c.type === 'select' ? (c.options || []).find(o => String(o.value ?? o) === String(v))?.label ?? String(v) : typeof v === 'object' ? v.en ?? '' : String(v));
  return (<div className="mobile-list stack">
    <div className="row">{rows.length > 0 && <Btn kind="primary" icon="SquarePen" onClick={() => onOpen(rows[0]._key)}>{t('mre.editOneByOne')}</Btn>}{!readOnly && <Btn icon="Plus" onClick={onAdd}>{t('mre.addRow')}</Btn>}{!readOnly && <Btn kind="ghost" icon="FileUp" onClick={onImport}>{t('imp.action')}</Btn>}</div>
    {!rows.length && <p className="small muted">{t('mre.empty')}</p>}
    <ul className="plain stack" aria-label={t('mre.list')}>{rows.map((r, i) => <li key={r._key}><button type="button" className="mobile-row" onClick={() => onOpen(r._key)}>
      <span className="row" style={{ flexWrap: 'nowrap' }}><StatusMark row={r} index={i} t={t} /><span className="strong small">{(title && title(r.data)) || show(columns[0], r.data[columns[0]?.key])}</span><Icon name="ChevronRight" size={16} className="muted-ico" style={{ marginInlineStart: 'auto' }} /></span>
      <span className="xs muted">{columns.slice(1, 4).map(c => `${c.label}: ${show(c, r.data[c.key])}`).join(' · ')}</span>
      {Object.values(r.errors)[0] && <span className="field-error"><Icon name="CircleAlert" size={12} />{Object.values(r.errors)[0]}</span>}</button></li>)}</ul>
  </div>);
}
