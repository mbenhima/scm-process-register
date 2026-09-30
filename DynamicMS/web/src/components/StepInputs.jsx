// Inputs of the step forms: plain fields, record tables with add / edit / delete (rows),
// decision matrix, KPI picker with "new KPI", organization units and people from the OBS,
// RACSI in five columns, document templates, standards and links to produced records.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, X, FileText, Table2, ListChecks, Gauge, Grid3x3, Maximize2, ChevronLeft, ChevronRight, Library, Sparkles } from 'lucide-react';
import { api } from '../lib/api.js';
import { Field, Modal, tx } from './ui.jsx';

const FREQ = ['Annual', 'Semi-annual', 'Quarterly', 'Monthly', 'Weekly'];
const cellText = (v, lang) => (v === null || v === undefined ? '' : typeof v === 'object' && !Array.isArray(v) ? (v.name ? tx(v.name, lang) : tx(v, lang)) : Array.isArray(v) ? v.map(x => cellText(x, lang)).join(', ') : String(v));

function Chips({ items, onRemove, disabled, label }) {
  if (!items.length) return null;
  return <div className="chips">{items.map((it, i) => <span key={i} className="chip">{it}{!disabled && <button type="button" className="chip-x" aria-label={`${label} ${it}`} onClick={() => onRemove(i)}><X size={12} /></button>}</span>)}</div>;
}

// Organization units from the OBS (with a free "other" value when allowed).
export function ObsPicker({ value, onChange, multiple = true, obs = [], disabled, t, lang, id, allowCustom = true }) {
  const list = Array.isArray(value) ? value : value ? [value] : [];
  const [custom, setCustom] = useState('');
  const add = (item) => { const next = multiple ? [...list.filter(x => !(x.id && x.id === item.id)), item] : [item]; onChange(multiple ? next : next[0]); };
  const units = obs.filter(n => n.type !== 'Project');
  return (
    <div className="stack-8" style={{ gap: 6 }}>
      <Chips items={list.map(x => cellText(x, lang))} disabled={disabled} label={t('Remove')} onRemove={(i) => onChange(multiple ? list.filter((_, j) => j !== i) : null)} />
      {!disabled && (
        <div className="row" style={{ gap: 6 }}>
          <select id={id} className="select" value="" onChange={e => { const n = units.find(x => x.id === e.target.value); if (n) add({ id: n.id, name: n.name }); }} style={{ flex: 2 }}>
            <option value="">{t('Choose an organization unit…')}</option>
            {units.map(n => <option key={n.id} value={n.id}>{n.type === 'Organization' ? '' : n.type === 'Site' ? '· ' : '·· '}{tx(n.name, lang)}</option>)}
          </select>
          {allowCustom && <><input className="input" style={{ flex: 1 }} placeholder={t('Other (type)')} value={custom} onChange={e => setCustom(e.target.value)} aria-label={t('Other (type)')} /><button type="button" className="btn btn-sm" disabled={!custom.trim()} onClick={() => { add({ id: null, name: custom.trim() }); setCustom(''); }}><Plus size={14} />{t('Add')}</button></>}
        </div>
      )}
    </div>
  );
}

// People of the organization; holders of the expected role are listed first.
export function PersonPicker({ value, onChange, users = [], role, disabled, t, id, roleNames }) {
  const first = role ? users.filter(u => u.roles.includes(role)) : [];
  const rest = users.filter(u => !first.includes(u));
  const label = (u) => `${u.name} — ${u.roles.map(r => roleNames[r] || r).join(', ')}`;
  return (
    <select id={id} className="select" value={value || ''} disabled={disabled} onChange={e => onChange(e.target.value || null)}>
      <option value="">{t('Choose a person…')}</option>
      {first.length > 0 && <optgroup label={t('Holders of the role')}>{first.map(u => <option key={u.id} value={u.id}>{label(u)}</option>)}</optgroup>}
      <optgroup label={t('Other people')}>{rest.map(u => <option key={u.id} value={u.id}>{label(u)}</option>)}</optgroup>
    </select>
  );
}

export function RolesPicker({ value, onChange, roles = [], disabled, t, lang, id, single }) {
  const list = Array.isArray(value) ? value : value ? [value] : [];
  const name = (c) => tx(roles.find(r => r.code === c)?.name, lang) || c;
  return (
    <div className="stack-8" style={{ gap: 6 }}>
      <Chips items={list.map(name)} disabled={disabled} label={t('Remove')} onRemove={(i) => onChange(list.filter((_, j) => j !== i))} />
      {!disabled && (!single || !list.length) && <select id={id} className="select" value="" onChange={e => e.target.value && onChange(single ? [e.target.value] : [...new Set([...list, e.target.value])])}><option value="">{t('Add a role…')}</option>{roles.filter(r => !list.includes(r.code)).map(r => <option key={r.code} value={r.code}>{tx(r.name, lang)}</option>)}</select>}
    </div>
  );
}

// RACSI in five columns; one Accountable only.
export function RacsiGrid({ value, onChange, roles, disabled, t, lang }) {
  const v = value || { R: [], A: [], C: [], S: [], I: [] };
  const LETTERS = [['R', t('Responsible')], ['A', t('Accountable (one)')], ['C', t('Consulted')], ['S', t('Support')], ['I', t('Informed')]];
  return (
    <div className="racsi-grid">
      {LETTERS.map(([L, label]) => (
        <div key={L} className="racsi-col">
          <div className="racsi-head"><span className="racsi-letter">{L}</span><span className="xsmall">{label}</span></div>
          <RolesPicker value={v[L] || []} single={L === 'A'} roles={roles} disabled={disabled} t={t} lang={lang} onChange={(list) => onChange({ ...v, [L]: list })} />
        </div>
      ))}
    </div>
  );
}

function NewKpiModal({ onClose, onCreated, stepId, t }) {
  const [f, setF] = useState({ name: '', formula: '', unit: '%', target: '', direction: 'up', frequency: 'Monthly' });
  const [busy, setBusy] = useState(false);
  const save = async () => { setBusy(true); try { const r = await api(`/steps/${stepId}/kpis`, { method: 'POST', body: f }); onCreated(r.id); } catch (e) { alert(e.message); } finally { setBusy(false); } };
  return (
    <Modal title={t('New KPI')} onClose={onClose} footer={<><button className="btn" onClick={onClose}>{t('Cancel')}</button><button className="btn btn-primary" disabled={busy || !f.name || f.target === ''} onClick={save}>{t('Create KPI')}</button></>}>
      <div className="stack">
        <Field label={t('Name')} required>{(id) => <input id={id} className="input" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />}</Field>
        <Field label={t('Formula')}>{(id) => <input id={id} className="input" value={f.formula} onChange={e => setF({ ...f, formula: e.target.value })} placeholder={t('e.g. signed job sheets / job sheets × 100')} />}</Field>
        <div className="form-grid">
          <Field label={t('Target')} required>{(id) => <input id={id} className="input num" type="number" value={f.target} onChange={e => setF({ ...f, target: e.target.value })} />}</Field>
          <Field label={t('Unit')}>{(id) => <input id={id} className="input" value={f.unit} onChange={e => setF({ ...f, unit: e.target.value })} />}</Field>
          <Field label={t('Direction')}>{(id) => <select id={id} className="select" value={f.direction} onChange={e => setF({ ...f, direction: e.target.value })}><option value="up">{t('Higher is better')}</option><option value="down">{t('Lower is better')}</option></select>}</Field>
          <Field label={t('Measurement frequency')}>{(id) => <select id={id} className="select" value={f.frequency} onChange={e => setF({ ...f, frequency: e.target.value })}>{['Monthly', 'Quarterly', 'Weekly', 'Annual'].map(x => <option key={x} value={x}>{x}</option>)}</select>}</Field>
        </div>
      </div>
    </Modal>
  );
}

export function KpiPicker({ value, onChange, kpis = [], disabled, t, lang, id, mpId, stepId, onKpiCreated }) {
  const [nw, setNw] = useState(false);
  const own = kpis.filter(k => k.mp_id === mpId);
  const others = kpis.filter(k => k.mp_id !== mpId);
  const lab = (k) => `${k.code} — ${tx(k.name, lang)} (${k.target_text || ''})`;
  return (
    <div className="row" style={{ gap: 6, flexWrap: 'nowrap' }}>
      <select id={id} className="select" value={value || ''} disabled={disabled} onChange={e => onChange(e.target.value || null)}>
        <option value="">{t('Choose a KPI…')}</option>
        {own.length > 0 && <optgroup label={t('KPIs of this macro process')}>{own.map(k => <option key={k.id} value={k.id}>{lab(k)}</option>)}</optgroup>}
        <optgroup label={t('Other KPIs of the project')}>{others.map(k => <option key={k.id} value={k.id}>{lab(k)}</option>)}</optgroup>
      </select>
      {!disabled && stepId && <button type="button" className="btn btn-sm" onClick={() => setNw(true)} title={t('New KPI')}><Plus size={14} />{t('New KPI')}</button>}
      {nw && <NewKpiModal t={t} stepId={stepId} onClose={() => setNw(false)} onCreated={async (kid) => { setNw(false); await onKpiCreated?.(); onChange(kid); }} />}
    </div>
  );
}

// A list with a "Custom…" entry: choose a proposed value or type your own.
// items: [{ key, label, value }]; the stored value is the item's value, or the typed text.
export function Combo({ items, value, onChange, disabled, t, aria, id, lang }) {
  const text = cellText(value, lang);
  const match = items.find(x => (typeof value === 'string' && x.key === value) || (value && x.label === text));
  const [chosen, setCustom] = useState(false);
  // Custom when the user picked "Custom…" or when the value is not in the list (once the list is loaded).
  const custom = chosen || (!!text && !match && items.length > 0);
  if (disabled) return <span>{match ? match.label : text}</span>;
  return (
    <div className="combo">
      <select id={id} className="select" aria-label={aria} value={custom ? '__custom' : match ? match.key : ''} onChange={e => {
        if (e.target.value === '__custom') { setCustom(true); onChange(''); return; }
        setCustom(false); const it = items.find(x => x.key === e.target.value); onChange(it ? it.value : '');
      }}>
        <option value="">{t('Choose…')}</option>
        {items.map(x => <option key={x.key} value={x.key}>{x.label}</option>)}
        <option value="__custom">{t('Custom…')}</option>
      </select>
      {custom && <input className="input" aria-label={`${aria} — ${t('Custom value')}`} placeholder={t('Type your own value')} value={text} onChange={e => onChange(e.target.value)} autoFocus />}
    </div>
  );
}
const optionItems = (options, lang, L, extra = []) => {
  const seen = new Set(); const out = [];
  for (const o of [...(options || []), ...extra]) {
    if (o === null || o === undefined || o === '') continue;
    const label = typeof o === 'object' ? tx(o, lang) : L ? L(o) : String(o);
    if (!label || seen.has(label)) continue; seen.add(label);
    out.push({ key: `o${out.length}`, label, value: o });
  }
  return out;
};
const mpItems = (mps, lang) => (mps || []).map(m => ({ key: m.id, label: `${m.code} (${tx(m.name, lang)})`, value: m.id }));
export const mpLabel = (v, mps, lang) => { const m = typeof v === 'string' ? (mps || []).find(x => x.id === v) : null; return m ? `${m.code} (${tx(m.name, lang)})` : cellText(v, lang); };

// Interested parties concerned by a need: several parties from the project, or typed.
export function PartiesPicker({ value, onChange, parties = [], disabled, t, lang, aria }) {
  const list = Array.isArray(value) ? value : [];
  const [custom, setCustom] = useState('');
  const [other, setOther] = useState(false);
  const names = list.map(x => cellText(x?.name ?? x, lang));
  if (disabled) return <span>{names.join(', ')}</span>;
  const add = (p) => { if (!names.includes(cellText(p.name, lang))) onChange([...list, p]); };
  return (
    <div className="stack-8" style={{ gap: 6 }}>
      <Chips items={names} label={t('Remove')} onRemove={(i) => onChange(list.filter((_, j) => j !== i))} />
      <select className="select" aria-label={aria} value="" onChange={e => { if (e.target.value === '__other') { setOther(true); return; } const p = parties[+e.target.value]; if (p) add(p); }}>
        <option value="">{t('Add an interested party…')}</option>
        {parties.map((p, i) => <option key={i} value={i} disabled={names.includes(cellText(p.name, lang))}>{cellText(p.name, lang)}</option>)}
        <option value="__other">{t('Other party (type)')}…</option>
      </select>
      {other && <div className="row" style={{ gap: 6, flexWrap: 'nowrap' }}><input className="input" placeholder={t('Other party (type)')} aria-label={t('Other party (type)')} value={custom} onChange={e => setCustom(e.target.value)} /><button type="button" className="btn btn-sm" disabled={!custom.trim()} onClick={() => { add({ id: null, name: custom.trim() }); setCustom(''); setOther(false); }}><Plus size={14} />{t('Add')}</button></div>}
    </div>
  );
}

// One editable cell of a record table.
function Cell({ col, value, onChange, disabled, ctx, big, rows: tableRows }) {
  const { t, lang, L, pickers, mpId, stepId, reloadPickers } = ctx;
  const aria = tx(col.label, lang);
  if (disabled) {
    if (col.type === 'person') return <span>{pickers?.users.find(u => u.id === value)?.name || ''}</span>;
    if (col.type === 'role') return <span>{tx(pickers?.roles.find(r => r.code === value)?.name, lang) || value || ''}</span>;
    if (col.type === 'kpi') { const k = pickers?.kpis.find(x => x.id === value); return <span>{k ? `${k.code} — ${tx(k.name, lang)}` : ''}</span>; }
    if (col.type === 'select') return <span>{value ? L(value) : ''}</span>;
    if (col.type === 'mp') return <span>{mpLabel(value, pickers?.mps, lang)}</span>;
    if (col.type === 'parties') return <span>{(Array.isArray(value) ? value : []).map(x => cellText(x?.name ?? x, lang)).join(', ')}</span>;
    return <span style={{ whiteSpace: 'pre-wrap' }}>{cellText(value, lang)}</span>;
  }
  const v = value === null || value === undefined ? '' : value;
  switch (col.type) {
    case 'textarea': return <textarea className={`textarea ${big ? '' : 'compact'}`} rows={big ? 6 : undefined} aria-label={aria} value={cellText(v, lang)} onChange={e => onChange(e.target.value)} />;
    case 'combo': return <Combo t={t} lang={lang} aria={aria} value={v} onChange={onChange} items={optionItems(col.options, lang, L, (tableRows || []).map(r => r[col.key]))} />;
    case 'mp': return <Combo t={t} lang={lang} aria={aria} value={v} onChange={onChange} items={mpItems(pickers?.mps, lang)} />;
    case 'parties': return <PartiesPicker t={t} lang={lang} aria={aria} value={v} parties={pickers?.parties || []} onChange={onChange} />;
    case 'number': return <input className="input num" type="number" aria-label={aria} value={v} onChange={e => onChange(e.target.value)} />;
    case 'date': return <input className="input" type="date" aria-label={aria} value={v} onChange={e => onChange(e.target.value)} />;
    case 'score': return <div className="score compact" role="group" aria-label={aria}>{[1, 2, 3, 4, 5].map(n => <button key={n} type="button" aria-pressed={+v === n} onClick={() => onChange(n)}>{n}</button>)}</div>;
    case 'select': return <select className="select" aria-label={aria} value={v} onChange={e => onChange(e.target.value)}><option value="">—</option>{(col.options || []).map(o => <option key={o} value={o}>{L(o)}</option>)}</select>;
    case 'role': return <select className="select" aria-label={aria} value={v} onChange={e => onChange(e.target.value)}><option value="">—</option>{(pickers?.roles || []).map(r => <option key={r.code} value={r.code}>{tx(r.name, lang)}</option>)}</select>;
    case 'person': return <PersonPicker t={t} value={v} users={pickers?.users || []} onChange={onChange} roleNames={Object.fromEntries((pickers?.roles || []).map(r => [r.code, tx(r.name, lang)]))} />;
    case 'kpi': return <KpiPicker t={t} lang={lang} value={v} kpis={pickers?.kpis || []} onChange={onChange} mpId={mpId} stepId={stepId} onKpiCreated={reloadPickers} />;
    case 'obs': return <ObsPicker t={t} lang={lang} value={v || []} obs={pickers?.obs || []} onChange={onChange} />;
    default: return <input className="input" aria-label={aria} value={cellText(v, lang)} onChange={e => onChange(e.target.value)} />;
  }
}

// A table of records (items, sources, SMART objectives, activities, decisions...) with CRUD.
// Full-size editor of one row, with scrolling, previous / next and a way back to the table.
function RowModal({ field, rows, index, setIndex, set, onClose, disabled, ctx }) {
  const { t, lang } = ctx;
  const r = rows[index] || {};
  const title = `${tx(field.label, lang)} — ${t('Row {n} of {m}', { n: index + 1, m: rows.length })}`;
  return (
    <Modal wide title={title} onClose={onClose} footer={<>
      <button type="button" className="btn" disabled={index === 0} onClick={() => setIndex(index - 1)}><ChevronLeft size={16} />{t('Previous row')}</button>
      <button type="button" className="btn" disabled={index >= rows.length - 1} onClick={() => setIndex(index + 1)}>{t('Next row')}<ChevronRight size={16} /></button>
      <button type="button" className="btn btn-primary" onClick={onClose}>{t('Back to the table')}</button>
    </>}>
      <div className="stack">
        {field.columns.map(c => <Field key={c.key} label={tx(c.label, lang)} required={c.required}>{() => <Cell col={c} big value={r[c.key]} disabled={disabled} ctx={ctx} rows={rows} onChange={(v) => set(index, c.key, v)} />}</Field>)}
      </div>
    </Modal>
  );
}

// Needs library: needs recorded before in the organization and the reference list.
function LibraryModal({ ctx, onAdd, onClose }) {
  const { t, lang, stepId } = ctx;
  const [items, setItems] = useState(null);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState([]);
  useEffect(() => { api(`/steps/${stepId}/needs-library`).then(r => setItems(r.items)).catch(() => setItems([])); }, [stepId]);
  const shown = (items || []).map((x, i) => ({ ...x, i })).filter(x => !q || cellText(x.need, lang).toLowerCase().includes(q.toLowerCase()));
  return (
    <Modal wide title={t('Add needs from the library')} onClose={onClose} footer={<><button className="btn" onClick={onClose}>{t('Cancel')}</button><button className="btn btn-primary" disabled={!sel.length} onClick={() => onAdd(sel.map(i => items[i]))}>{t('Add {n} need(s)', { n: sel.length })}</button></>}>
      <div className="stack-8">
        <p className="small muted" style={{ margin: 0 }}>{t('Needs already recorded in the organization and a reference list. They are not linked to any party: link them to the interested parties in the table.')}</p>
        <input className="input" placeholder={t('Filter…')} aria-label={t('Filter')} value={q} onChange={e => setQ(e.target.value)} />
        {items === null ? <p className="small muted">{t('Loading…')}</p> : shown.map(x => <label key={x.i} className="checkbox small"><input type="checkbox" checked={sel.includes(x.i)} onChange={e => setSel(e.target.checked ? [...sel, x.i] : sel.filter(y => y !== x.i))} /><span>{cellText(x.need, lang)} <span className="xsmall muted">· {x.from === 'organization' ? t('Recorded in the organization') : t('Reference list')}</span></span></label>)}
      </div>
    </Modal>
  );
}

export function RowsEditor({ field, value, onChange, disabled, ctx }) {
  const { t, lang } = ctx;
  const rows = Array.isArray(value) ? value : [];
  const [open, setOpen] = useState(null);
  const [lib, setLib] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiNote, setAiNote] = useState(null);
  const blank = () => Object.fromEntries(field.columns.map(c => [c.key, c.type === 'obs' || c.type === 'parties' ? [] : '']));
  const suggestNeeds = async () => {
    setAiBusy(true); setAiNote(null);
    try {
      const r = await api(`/steps/${ctx.stepId}/needs-suggest`, { method: 'POST', body: {} });
      onChange([...rows, ...r.rows.map(x => ({ ...blank(), ...x }))]);
      setAiNote({ engine: r.engine, error: r.llmError, n: r.rows.length });
    } catch (e) { setAiNote({ error: e.message, n: 0 }); } finally { setAiBusy(false); }
  };
  const set = (i, key, v) => onChange(rows.map((r, j) => (j === i ? { ...r, [key]: v } : r)));
  const add = () => { onChange([...rows, blank()]); setOpen(rows.length); };
  const del = (i) => onChange(rows.filter((_, j) => j !== i));
  const wide = field.columns.length > 4;
  const linked = rows.some(r => r._actionId || r._registerId);
  return (
    <div className="rows-editor">
      <div className="table-wrap">
        <table className={`data rows ${wide ? 'wide' : ''}`}>
          <thead><tr><th scope="col" style={{ width: 36 }}>#</th>{field.columns.map(c => <th key={c.key} scope="col">{tx(c.label, lang)}{c.required && <span className="req" aria-hidden="true">*</span>}</th>)}{linked && <th scope="col">{t('Record created')}</th>}<th scope="col" style={{ width: disabled ? 44 : 84 }}><span className="sr-only">{t('Actions')}</span></th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td className="muted">{i + 1}</td>
                {field.columns.map(c => <td key={c.key} style={disabled ? undefined : { minWidth: c.wide ? 280 : c.type === 'textarea' ? 220 : ['person', 'kpi', 'obs', 'parties', 'mp', 'combo'].includes(c.type) ? 210 : c.type === 'date' ? 140 : 120 }}><Cell col={c} value={r[c.key]} disabled={disabled} ctx={ctx} rows={rows} onChange={(v) => set(i, c.key, v)} /></td>)}
                {linked && <td>{r._actionId ? <Link to="/actions" className="tag s4">{t('Action')}</Link> : r._registerId ? <Link to="/registers?reg=objectives" className="tag s4">{t('Objective')}</Link> : '—'}</td>}
                <td className="row-actions"><button type="button" className="btn btn-ghost btn-icon btn-sm" title={t('Open the row in a large window')} aria-label={t('Open row {n}', { n: i + 1 })} onClick={() => setOpen(i)}><Maximize2 size={16} /></button>{!disabled && <button type="button" className="btn btn-ghost btn-icon btn-sm" aria-label={t('Delete row {n}', { n: i + 1 })} onClick={() => del(i)}><Trash2 size={16} /></button>}</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={field.columns.length + 3} className="muted small">{t('No row yet.')}</td></tr>}
          </tbody>
        </table>
      </div>
      {!disabled && <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-sm" onClick={add}><Plus size={14} />{field.needs ? t('Type a need') : t('Add a row')}</button>
        {field.needs && <button type="button" className="btn btn-sm" onClick={() => setLib(true)}><Library size={14} />{t('Add from the library')}</button>}
        {field.needs && <button type="button" className="btn btn-sm" disabled={aiBusy} onClick={suggestNeeds}><Sparkles size={14} />{aiBusy ? t('Preparing…') : t('Suggest with AI')}</button>}
        <span className="xsmall muted">{t('Tip: open a row in a large window to type long texts.')}</span>
      </div>}
      {aiNote && <div className={`callout ${aiNote.error ? 'warn' : 'good'} small`} role="status"><span>{aiNote.n ? t('{n} need(s) suggested by {engine}: review them, link the parties and delete what does not apply.', { n: aiNote.n, engine: String(aiNote.engine || '').startsWith('rules') ? t('the built-in engine') : aiNote.engine }) : ''} {aiNote.error ? t('Language model: {e}', { e: aiNote.error }) : ''}</span></div>}
      {open !== null && rows[open] && <RowModal field={field} rows={rows} index={open} setIndex={setOpen} set={set} disabled={disabled} ctx={ctx} onClose={() => setOpen(null)} />}
      {lib && <LibraryModal ctx={ctx} onClose={() => setLib(false)} onAdd={(list) => { onChange([...rows, ...list.map(x => ({ ...blank(), need: x.need, origin: 'Library' }))]); setLib(false); }} />}
      {field.createsActions && <p className="hint">{t('On completion, each row becomes an action in the Action plan, with its owner and due date.')}</p>}
      {field.createsObjectives && <p className="hint">{t('On completion, each row becomes an entry of the objectives register.')}</p>}
    </div>
  );
}

// Decision matrix: criteria, weights and 1–5 scores; the weighted score is computed.
export function MatrixEditor({ field, value, onChange, disabled, ctx, scale }) {
  const { t, lang } = ctx;
  const rows = Array.isArray(value) ? value : [];
  const valid = rows.filter(r => +r.score >= 1 && +r.score <= 5);
  const w = valid.reduce((a, r) => a + (+r.weight > 0 ? +r.weight : 1), 0);
  const score = valid.length ? Math.round((valid.reduce((a, r) => a + (+r.weight > 0 ? +r.weight : 1) * +r.score, 0) / w) * 10) / 10 : null;
  const totalW = rows.reduce((a, r) => a + (+r.weight || 0), 0);
  return (
    <div className="stack-8">
      <RowsEditor field={field} value={rows} onChange={onChange} disabled={disabled} ctx={ctx} />
      <div className="matrix-foot">
        <span className="strong">{t('Weighted score')}: <span className="num">{score ?? '—'}</span> / 5</span>
        <span className={`small ${totalW === 100 ? 'muted' : ''}`}>{t('Total weight {w}% (aim for 100%)', { w: totalW })}</span>
      </div>
      {scale && <details className="small"><summary>{t('Scoring scale')}</summary><ul className="list" style={{ marginTop: 6 }}>{scale.map(s => <li key={s.score}><span className="strong">{s.score}</span> — {tx(s.label, lang)}</li>)}</ul></details>}
    </div>
  );
}

const REF_ICON = { document: FileText, register: Table2, action: ListChecks, kpi: Gauge, racsi: Grid3x3 };
const refLink = (r) => (r.type === 'document' ? `/documents/${r.id}` : r.type === 'register' ? `/registers?reg=${r.register || ''}` : r.type === 'action' ? '/actions' : r.type === 'kpi' ? '/kpis' : r.type === 'racsi' ? '/racsi' : '#');
export function RecordsList({ value, t, lang }) {
  const list = Array.isArray(value) ? value : [];
  if (!list.length) return <p className="small muted" style={{ margin: 0 }}>{t('No linked record yet. Records are linked when the step is completed or a document is generated.')}</p>;
  return <ul className="list small">{list.map((r, i) => { const I = REF_ICON[r.type] || FileText; return <li key={i}><Link to={refLink(r)} className="row" style={{ gap: 8 }}><I size={16} aria-hidden="true" /><span>{r.code ? `${r.code} — ` : ''}{tx(r.title, lang)}</span></Link></li>; })}</ul>;
}

// Any field of a step form.
export function StepField({ f, value, onChange, disabled, lang, t, L, error, ctx, scale }) {
  const label = tx(f.label, lang);
  const common = { disabled, 'aria-invalid': !!error };
  if (f.type === 'rows' || f.type === 'kpis') return <Field label={label} required={f.required} error={error}>{() => <RowsEditor field={f} value={value} onChange={onChange} disabled={disabled} ctx={ctx} />}</Field>;
  if (f.type === 'matrix') return <Field label={label} required={f.required} error={error}>{() => <MatrixEditor field={f} value={value} onChange={onChange} disabled={disabled} ctx={ctx} scale={scale} />}</Field>;
  if (f.type === 'racsi') return <Field label={label} error={error} hint={t('RACSI of the macro process; step-level RACSI can be set on the macro process page.')}>{() => <RacsiGrid value={value} onChange={onChange} roles={ctx.pickers?.roles || []} disabled={disabled} t={t} lang={lang} />}</Field>;
  if (f.type === 'records') return <Field label={label}>{() => <RecordsList value={value} t={t} lang={lang} />}</Field>;
  const hint = f.hint ? tx(f.hint, lang) : undefined;
  if (f.computed) return <Field label={label} error={error} hint={hint}>{(id) => <input id={id} className="input num" value={value ?? ''} readOnly aria-readonly="true" placeholder={t('Computed from the matrix')} />}</Field>;
  return (
    <Field label={label} required={f.required} error={error} hint={hint}>
      {(id) => {
        const v = value ?? '';
        if (f.type === 'textarea') return <textarea id={id} className="textarea" value={cellText(v, lang)} onChange={e => onChange(e.target.value)} {...common} />;
        if (f.type === 'text') return <input id={id} className="input" value={cellText(v, lang)} onChange={e => onChange(e.target.value)} {...common} />;
        if (f.type === 'number') return <input id={id} className="input num" type="number" value={v} onChange={e => onChange(e.target.value)} {...common} />;
        if (f.type === 'date') return <input id={id} className="input" type="date" value={v} onChange={e => onChange(e.target.value)} {...common} />;
        if (f.type === 'score') return <div className="score" role="group" aria-labelledby={id}>{[1, 2, 3, 4, 5].map(n => <button key={n} type="button" id={n === 1 ? id : undefined} aria-pressed={+v === n} disabled={disabled} onClick={() => onChange(n)}>{n}</button>)}</div>;
        if (f.type === 'role') return <select id={id} className="select" value={v} onChange={e => onChange(e.target.value)} {...common}><option value="">{t('Choose…')}</option>{(ctx.pickers?.roles || []).map(r => <option key={r.code} value={r.code}>{tx(r.name, lang)}</option>)}</select>;
        if (f.type === 'roles') return <RolesPicker id={id} value={v || []} roles={ctx.pickers?.roles || []} onChange={onChange} disabled={disabled} t={t} lang={lang} />;
        if (f.type === 'person') return <PersonPicker id={id} t={t} value={v} users={ctx.pickers?.users || []} role={ctx.role} onChange={onChange} disabled={disabled} roleNames={Object.fromEntries((ctx.pickers?.roles || []).map(r => [r.code, tx(r.name, lang)]))} />;
        if (f.type === 'obs') return <ObsPicker id={id} t={t} lang={lang} value={v || []} obs={ctx.pickers?.obs || []} multiple={f.multiple !== false} onChange={onChange} disabled={disabled} />;
        if (f.type === 'template') return <select id={id} className="select" value={v} onChange={e => onChange(e.target.value)} {...common}><option value="">{t('Choose a template…')}</option>{(ctx.templates || []).length > 0 && <optgroup label={t('Suggested for this macro process')}>{ctx.templates.map(x => <option key={x.code} value={x.code}>{x.code} — {tx(x.name, lang)}</option>)}</optgroup>}<optgroup label={t('All templates')}>{(ctx.pickers?.templates || []).map(x => <option key={x.code} value={x.code}>{x.code} — {tx(x.name, lang)}</option>)}</optgroup></select>;
        if (f.type === 'standards') {
          const list = Array.isArray(v) ? v : [];
          return <div className="form-grid" id={id}>{(ctx.pickers?.standards || []).map(s => <label key={s} className="checkbox small"><input type="checkbox" disabled={disabled} checked={list.includes(s)} onChange={e => onChange(e.target.checked ? [...list, s] : list.filter(x => x !== s))} /><span>{s}</span></label>)}</div>;
        }
        if (f.type === 'select') {
          const opts = f.options || (f.list === 'LST-FREQ' ? FREQ : []);
          return <select id={id} className="select" value={v} onChange={e => onChange(e.target.value)} {...common}><option value="">{t('Choose…')}</option>{opts.map(o => <option key={o} value={o}>{L(o)}</option>)}</select>;
        }
        return <input id={id} className="input" value={cellText(v, lang)} onChange={e => onChange(e.target.value)} {...common} />;
      }}
    </Field>
  );
}

export const isEmptyValue = (v) => v === null || v === undefined || (typeof v === 'string' && !v.trim()) || (Array.isArray(v) && !v.length) || (typeof v === 'object' && !Array.isArray(v) && !Object.values(v).some(x => (Array.isArray(x) ? x.length : String(x ?? '').trim())));
