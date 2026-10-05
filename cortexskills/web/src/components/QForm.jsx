// Renders a questionnaire form (identity, tables, grids, questions, ratings, SWOT, yes/no) for a respondent or an
// interviewer. Tables are rows the user adds and edits; choices are controlled lists; nothing is free text unless the
// question asks for it. Used by the public response page, the face-to-face capture and the read-only response view.
import { useMemo } from 'react';
import { useI18n } from '../lib/i18n.jsx';
import { Icon, Btn } from './ui.jsx';

const nonEmpty = v => v != null && (typeof v === 'object' ? Object.values(v).some(nonEmpty) : String(v).trim() !== '' && v !== false);
export function completeness(sections, answers = {}, flags = {}) {
  let total = 0, filled = 0;
  for (const s of sections || []) {
    if (s.type === 'note' || (s.condition === 'previous_plan' && flags.previous_plan === false) || (s.condition === 'hr_function' && flags.hr_function !== true)) continue;
    const a = answers[s.id];
    const keys = s.type === 'identity' ? s.fields : s.type === 'swot' ? s.boxes : s.type === 'grid' ? s.rows : ['questions', 'rating', 'yesno'].includes(s.type) ? s.items : null;
    if (keys) for (const k of keys) { total++; if (nonEmpty(s.type === 'yesno' ? a?.[k.key]?.value : a?.[k.key])) filled++; }
    else if (s.type === 'table') { total++; if (Array.isArray(a) && a.some(nonEmpty)) filled++; }
  }
  return total ? Math.round((filled * 1000) / total) / 10 : 0;
}

function Cell({ col, value, onChange, readOnly, label, functions }) {
  const { t, L } = useI18n();
  const id = useMemo(() => 'c' + Math.random().toString(36).slice(2, 8), []);
  if (readOnly) {
    const v = col.kind === 'check' ? (value ? '✓' : '') : col.kind === 'yesno' ? (value ? t('common.' + String(value).toLowerCase()) : '') : col.kind === 'choice' ? L((col.options || []).find(o => o.en === value)) || value : value;
    return <span>{v ?? ''}</span>;
  }
  if (col.kind === 'check') return <input type="checkbox" checked={!!value} onChange={e => onChange(e.target.checked)} aria-label={label} />;
  if (col.kind === 'yesno') return <select className="input" value={value || ''} onChange={e => onChange(e.target.value)} aria-label={label}><option value="">—</option><option value="Yes">{t('common.yes')}</option><option value="No">{t('common.no')}</option></select>;
  if (col.kind === 'scale') return <select className="input" value={value ?? ''} onChange={e => onChange(e.target.value)} aria-label={label}><option value="">—</option>{col.allowNew && <option value="Nv">Nv</option>}{[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}</select>;
  if (col.kind === 'choice') return <select className="input" value={value || ''} onChange={e => onChange(e.target.value)} aria-label={label}><option value="">—</option>{(col.options || []).map(o => <option key={o.en} value={o.en}>{L(o)}</option>)}</select>;
  if (col.kind === 'number') return <input className="input" type="number" min="0" value={value ?? ''} onChange={e => onChange(e.target.value)} aria-label={label} />;
  if (col.kind === 'date') return <input className="input" type="date" value={value ?? ''} onChange={e => onChange(e.target.value)} aria-label={label} />;
  if (col.kind === 'function') return <><input className="input" list={id} value={value ?? ''} onChange={e => onChange(e.target.value)} aria-label={label} placeholder={t('qf.functionOrCustom')} /><datalist id={id}>{(functions || []).map(f => <option key={f} value={f} />)}</datalist></>;
  return <textarea className="input" rows={2} value={value ?? ''} onChange={e => onChange(e.target.value)} aria-label={label} />;
}

export function QForm({ form, answers, flags = {}, onChange, onFlags, readOnly = false, functions = [] }) {
  const { t, L } = useI18n();
  const set = (sid, v) => onChange({ ...answers, [sid]: v });
  if (!form) return null;
  return (<div className="stack qform">{form.sections.map((s, si) => {
    const a = answers[s.id]; const hidden = (s.condition === 'previous_plan' && flags.previous_plan === false) || (s.condition === 'hr_function' && flags.hr_function !== true);
    return (<section key={s.id} className={`card qsection ${s.type === 'note' ? 'tint' : ''}`} aria-labelledby={'h-' + s.id}>
      <div className="card-head"><div><div className="eyebrow">{t('qf.section', { n: si + 1 })}{s.origin === 'ai' && <span className="pill tint xs" style={{ marginInlineStart: 8 }}><Icon name="Sparkles" size={12} />{t('qf.aiQuestion')}</span>}</div><h3 id={'h-' + s.id}>{L(s.title)}</h3></div></div>
      {s.instructions && <p className="small muted">{L(s.instructions)}</p>}
      {s.condition === 'previous_plan' && <label className="row small"><input type="checkbox" disabled={readOnly} checked={flags.previous_plan !== false} onChange={e => onFlags?.({ ...flags, previous_plan: e.target.checked })} />{t('qf.hadPreviousPlan')}</label>}
      {s.condition === 'hr_function' && <label className="row small"><input type="checkbox" disabled={readOnly} checked={flags.hr_function === true} onChange={e => onFlags?.({ ...flags, hr_function: e.target.checked })} />{t('qf.hrFunction')}</label>}
      {!hidden && s.type === 'identity' && <div className="grid g-3">{s.fields.map(f => <div className="field" key={f.key}><label>{L(f.label)}</label>{readOnly ? <span>{a?.[f.key] ?? '—'}</span> : <input className="input" type={f.kind === 'number' ? 'number' : 'text'} value={a?.[f.key] ?? ''} onChange={e => set(s.id, { ...a, [f.key]: e.target.value })} />}</div>)}</div>}
      {!hidden && (s.type === 'questions') && <div className="stack">{s.items.map(it => <div className="field" key={it.key}><label>{L(it.label)}{it.origin === 'ai' && <span className="pill tint xs" style={{ marginInlineStart: 6 }}>{t('qf.ai')}</span>}</label>
        {readOnly ? <p className="small">{a?.[it.key] || '—'}</p> : <textarea className="input" rows={3} value={a?.[it.key] ?? ''} onChange={e => set(s.id, { ...a, [it.key]: e.target.value })} />}</div>)}</div>}
      {!hidden && s.type === 'rating' && <div className="table-wrap"><table className="tbl"><thead><tr><th>{t('qf.competence')}</th><th>{t('qf.rating')}{s.scale?.allowNew ? ' (Nv, 1–5)' : ' (1–5)'}</th></tr></thead>
        <tbody>{s.items.map(it => <tr key={it.key}><td>{L(it.label)}</td><td style={{ width: 140 }}><Cell col={{ kind: 'scale', allowNew: s.scale?.allowNew }} value={a?.[it.key]} readOnly={readOnly} label={L(it.label)} onChange={v => set(s.id, { ...a, [it.key]: v })} /></td></tr>)}</tbody></table></div>}
      {!hidden && s.type === 'yesno' && <div className="table-wrap"><table className="tbl"><tbody>{s.items.map(it => <tr key={it.key}><td>{L(it.label)}</td>
        <td style={{ width: 120 }}><Cell col={{ kind: 'yesno' }} value={a?.[it.key]?.value} readOnly={readOnly} label={L(it.label)} onChange={v => set(s.id, { ...a, [it.key]: { ...(a?.[it.key] || {}), value: v } })} /></td>
        <td>{readOnly ? <span className="small">{a?.[it.key]?.comment}</span> : <input className="input" placeholder={t('qf.comment')} value={a?.[it.key]?.comment ?? ''} onChange={e => set(s.id, { ...a, [it.key]: { ...(a?.[it.key] || {}), comment: e.target.value } })} aria-label={t('qf.comment')} />}</td></tr>)}</tbody></table></div>}
      {!hidden && s.type === 'swot' && <div className={`grid g-${Math.min(4, s.boxes.length)}`}>{s.boxes.map(b => <div className="field" key={b.key}><label>{L(b.label)}</label>{readOnly ? <p className="small">{a?.[b.key] || '—'}</p> : <textarea className="input" rows={4} value={a?.[b.key] ?? ''} onChange={e => set(s.id, { ...a, [b.key]: e.target.value })} />}</div>)}</div>}
      {!hidden && s.type === 'grid' && <div className="table-wrap"><table className="tbl"><thead><tr><th>{''}</th>{s.columns.map(c => <th key={c.key}>{L(c.label)}</th>)}</tr></thead>
        <tbody>{s.rows.map((rw, k) => <tr key={rw.key}><td>{rw.group && (k === 0 || L(s.rows[k - 1].group) !== L(rw.group)) && <div className="xs muted">{L(rw.group)}</div>}<span className="strong small">{L(rw.label)}</span>{rw.hint && <div className="xs muted">{L(rw.hint)}</div>}</td>
          {s.columns.map(c => <td key={c.key}><Cell col={c} value={a?.[rw.key]?.[c.key]} readOnly={readOnly} label={`${L(rw.label)} — ${L(c.label)}`} onChange={v => set(s.id, { ...a, [rw.key]: { ...(a?.[rw.key] || {}), [c.key]: v } })} /></td>)}</tr>)}</tbody></table></div>}
      {!hidden && s.type === 'table' && <TableSection s={s} rows={Array.isArray(a) ? a : []} readOnly={readOnly} functions={functions} onChange={v => set(s.id, v)} />}
    </section>);
  })}</div>);
}

function TableSection({ s, rows, readOnly, onChange, functions }) {
  const { t, L } = useI18n();
  const shown = rows.length ? rows : readOnly ? [] : Array.from({ length: s.minRows || 1 }, () => ({}));
  const upd = (i, k, v) => { const next = [...shown]; next[i] = { ...next[i], [k]: v }; onChange(next); };
  return (<div className="stack"><div className="table-wrap"><table className="tbl"><thead><tr>{s.columns.map(c => <th key={c.key}>{L(c.label)}</th>)}{!readOnly && <th aria-label={t('common.delete')} />}</tr></thead>
    <tbody>{shown.map((r, i) => <tr key={i}>{s.columns.map(c => <td key={c.key} style={{ minWidth: c.kind === 'check' ? 60 : 140 }}><Cell col={c} value={r[c.key]} readOnly={readOnly} functions={functions} label={`${L(c.label)} ${i + 1}`} onChange={v => upd(i, c.key, v)} /></td>)}
      {!readOnly && <td><Btn icon="Trash2" kind="ghost" size="sm" aria-label={t('common.delete')} onClick={() => onChange(shown.filter((_, k) => k !== i))} /></td>}</tr>)}
      {!shown.length && <tr><td colSpan={s.columns.length}><span className="muted small">{t('qf.noRows')}</span></td></tr>}</tbody></table></div>
    {!readOnly && <div><Btn icon="Plus" size="sm" onClick={() => onChange([...shown, {}])}>{t('qf.addRow')}</Btn></div>}</div>);
}
